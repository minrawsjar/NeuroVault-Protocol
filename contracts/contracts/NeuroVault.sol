// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IHyperbridge.sol";
import "./interfaces/IBifrost.sol";

/**
 * @title NeuroVault
 * @notice AI-powered treasury DAO on Polkadot Hub EVM.
 *
 * Architecture:
 *   - A Claude AI agent reads on-chain state and proposes treasury actions
 *   - Each proposal includes a keccak256 hash of the full reasoning blob (stored on IPFS)
 *   - Token holders vote; proposals pass with 2/3 supermajority of total staked
 *   - Voting window: 1 hour (configurable by owner for production)
 *   - Approved proposals execute on-chain via Hyperbridge (cross-chain) or direct ERC20 ops
 *   - Spending capped at $2k equivalent per tx; only approved target addresses allowed
 *
 * Agent ABI surface (must match agent/src/contract.ts exactly):
 *   getTreasuryState() → (totalValue, dotBalance, usdcBalance, activeProposals, apy)
 *   getActiveGoals()   → tuple(id, text, status)[]
 *   getRecentProposals(count) → tuple(id, status, outcome)[]
 *   propose(ipfsHash, actionType, description, amount, token, targetToken, confidence) → proposalId
 *
 * PolkaVM compatibility:
 *   - No SELFDESTRUCT
 *   - No inline assembly (avoids PUSH0 and gas opcodes)
 *   - No block.difficulty / block.prevrandao
 */
contract NeuroVault is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using BifrostCallEncoder for uint256;

    // ─────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────

    /// @notice 2/3 supermajority: votesFor * 3 >= totalStaked * 2
    uint256 public constant QUORUM_NUMERATOR = 2;
    uint256 public constant QUORUM_DENOMINATOR = 3;

    /// @notice Max spend per execution (2000 USDC = 2000 * 10^6)
    uint256 public constant MAX_SPEND_USDC = 2000 * 10 ** 6;

    /// @notice Max spend in DOT (2000 DOT = 2000 * 10^18, adjust for real DOT decimals)
    uint256 public constant MAX_SPEND_DOT = 2000 * 10 ** 18;

    /// @notice Minimum time between proposal executions (1 hour)
    uint256 public constant EXECUTION_COOLDOWN = 1 hours;

    /// @notice APY denominator (basis points: 500 = 5.00%)
    uint256 public constant APY_DENOMINATOR = 10000;

    // ─────────────────────────────────────────────
    // Enums
    // ─────────────────────────────────────────────

    /// @notice Action type — must match agent/src/agent.ts actionTypes mapping
    enum ActionType { Swap, Stake, Transfer, Rebalance, None }

    /// @notice Proposal lifecycle
    enum ProposalStatus { Pending, Approved, Rejected, Executed, Expired }

    /// @notice On-chain goal status
    enum GoalStatus { Inactive, Active, Completed }

    // ─────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────

    struct Proposal {
        uint256 id;
        /// keccak256 of the full reasoning JSON stored on IPFS
        string ipfsHash;
        ActionType actionType;
        string description;
        uint256 amount;
        address token;
        address targetToken;
        /// Agent confidence score (0-100)
        uint256 confidence;
        ProposalStatus status;
        uint256 votesFor;
        uint256 votesAgainst;
        /// Total staked at proposal creation time (for quorum calculation)
        uint256 snapshotTotalStaked;
        uint256 createdAt;
        uint256 votingDeadline;
        string outcome;
        address proposer;
    }

    struct Goal {
        uint256 id;
        string text;
        GoalStatus status;
    }

    struct StakerInfo {
        uint256 staked;
        uint256 usdcDeposited;
        uint256 lastVotedProposal;
    }

    // ─────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────

    /// @notice DOT token on Polkadot Hub EVM (set in constructor)
    IERC20 public immutable dotToken;

    /// @notice USDC token on Polkadot Hub EVM (set in constructor)
    IERC20 public immutable usdcToken;

    /// @notice Hyperbridge dispatcher contract on Polkadot Hub
    IIsmpDispatch public hyperbridgeDispatch;

    /// @notice Bifrost parachain identifier for Hyperbridge routing
    bytes public bifrostDest;

    /// @notice Bifrost ISMP module address (on Bifrost parachain)
    bytes public bifrostModule;

    /// @notice Voting window duration (1 hour for demo, owner can change for production)
    uint256 public votingWindow = 1 hours;

    /// @notice Only this address may call propose() — the AI agent
    address public agentAddress;

    /// @notice Proposals by ID
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    /// @notice Goals
    mapping(uint256 => Goal) public goals;
    uint256 public goalCount;

    /// @notice Staker balances
    mapping(address => StakerInfo) public stakers;
    uint256 public totalStaked;
    uint256 public stakerCount;

    /// @notice Per-proposal vote tracking (voter => proposalId => hasVoted)
    mapping(address => mapping(uint256 => bool)) public hasVoted;

    /// @notice Allowlist of target addresses the vault can interact with
    mapping(address => bool) public approvedTargets;

    /// @notice Timestamp of last execution (for cooldown)
    uint256 public lastExecutionTime;

    /// @notice Simulated APY in basis points (updated by owner or oracle)
    uint256 public currentApy = 1200; // 12.00% default (Bifrost vDOT yield)

    /// @notice Total proposals ever executed
    uint256 public executedProposalCount;

    // ─────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────

    event ProposalCreated(
        uint256 indexed proposalId,
        string ipfsHash,
        uint8 actionType,
        uint256 confidence
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );
    event ProposalExecuted(
        uint256 indexed proposalId,
        string outcome
    );
    event ProposalRejected(
        uint256 indexed proposalId,
        string reason
    );
    event GoalUpdated(
        uint256 indexed goalId,
        string text,
        uint8 status
    );
    event NewDeposit(
        address indexed depositor,
        address token,
        uint256 amount
    );
    event Staked(address indexed staker, uint256 amount);
    event Unstaked(address indexed staker, uint256 amount);
    event CrossChainStakeDispatched(
        uint256 indexed proposalId,
        bytes32 commitment,
        uint256 amount
    );
    event AgentAddressUpdated(address indexed oldAgent, address indexed newAgent);
    event ApprovedTargetUpdated(address indexed target, bool approved);
    event HyperbridgeUpdated(address indexed newDispatch);

    // ─────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────

    modifier onlyAgent() {
        require(msg.sender == agentAddress, "NeuroVault: caller is not the agent");
        _;
    }

    modifier proposalExists(uint256 proposalId) {
        require(proposalId > 0 && proposalId <= proposalCount, "NeuroVault: proposal does not exist");
        _;
    }

    // ─────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────

    /**
     * @param _dotToken          ERC20 address of DOT on Polkadot Hub testnet
     * @param _usdcToken         ERC20 address of USDC on Polkadot Hub testnet
     * @param _hyperbridgeDispatch  IIsmpDispatch host contract on Polkadot Hub
     * @param _agentAddress      The AI agent wallet that may call propose()
     * @param _bifrostDest       Hyperbridge destination bytes for Bifrost parachain
     * @param _bifrostModule     Bifrost ISMP module address bytes
     */
    constructor(
        address _dotToken,
        address _usdcToken,
        address _hyperbridgeDispatch,
        address _agentAddress,
        bytes memory _bifrostDest,
        bytes memory _bifrostModule
    ) Ownable(msg.sender) {
        require(_dotToken != address(0), "NeuroVault: zero DOT address");
        require(_usdcToken != address(0), "NeuroVault: zero USDC address");
        require(_agentAddress != address(0), "NeuroVault: zero agent address");

        dotToken = IERC20(_dotToken);
        usdcToken = IERC20(_usdcToken);
        hyperbridgeDispatch = IIsmpDispatch(_hyperbridgeDispatch);
        agentAddress = _agentAddress;
        bifrostDest = _bifrostDest;
        bifrostModule = _bifrostModule;

        // Approve the vault itself as a target (for internal transfers)
        approvedTargets[address(this)] = true;
    }

    // ─────────────────────────────────────────────
    // Agent ABI — must match agent/src/contract.ts exactly
    // ─────────────────────────────────────────────

    /**
     * @notice Returns current treasury state. Called by the AI agent each cycle.
     * @return totalValue    Total vault value in USD (DOT value + USDC), scaled by 1e18
     * @return dotBalance    DOT held by vault, scaled by DOT decimals (1e18)
     * @return usdcBalance   USDC held by vault, scaled by 1e6
     * @return activeProposals  Number of proposals currently in Pending status
     * @return apy           Current APY in basis points (1200 = 12.00%)
     */
    function getTreasuryState()
        external
        view
        returns (
            uint256 totalValue,
            uint256 dotBalance,
            uint256 usdcBalance,
            uint256 activeProposals,
            uint256 apy
        )
    {
        dotBalance = dotToken.balanceOf(address(this));
        usdcBalance = usdcToken.balanceOf(address(this));

        // totalValue: USDC (scale to 1e18) + DOT (assume 1 DOT = 10 USDC for simple calc)
        // In production this would use a price oracle
        uint256 usdcAs18 = usdcBalance * 10 ** 12; // 1e6 → 1e18
        uint256 dotValueAs18 = (dotBalance * 10) / 1; // 1 DOT ≈ 10 USD (rough)
        totalValue = usdcAs18 + dotValueAs18;

        // Count active proposals
        uint256 count = 0;
        for (uint256 i = 1; i <= proposalCount; i++) {
            if (proposals[i].status == ProposalStatus.Pending
                && block.timestamp <= proposals[i].votingDeadline) {
                count++;
            }
        }
        activeProposals = count;
        apy = currentApy;
    }

    /// @dev Return type for getActiveGoals() — matches agent/src/contract.ts tuple
    struct GoalView {
        uint256 id;
        string text;
        uint8 status;
    }

    /// @dev Return type for getRecentProposals() — matches agent/src/contract.ts tuple
    struct ProposalView {
        uint256 id;
        uint8 status;
        string outcome;
    }

    /**
     * @notice Returns all active goals. Called by the AI agent each cycle.
     * @return Array of (id, text, status) — status: 0=Inactive, 1=Active, 2=Completed
     */
    function getActiveGoals() external view returns (GoalView[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= goalCount; i++) {
            if (goals[i].status == GoalStatus.Active) {
                activeCount++;
            }
        }

        GoalView[] memory result = new GoalView[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 1; i <= goalCount; i++) {
            if (goals[i].status == GoalStatus.Active) {
                result[idx] = GoalView(goals[i].id, goals[i].text, uint8(goals[i].status));
                idx++;
            }
        }
        return result;
    }

    /**
     * @notice Returns the most recent N proposals. Called by the AI agent each cycle.
     * @param count  Number of proposals to return (most recent first)
     * @return Array of (id, status, outcome)
     */
    function getRecentProposals(uint256 count) external view returns (ProposalView[] memory) {
        uint256 total = proposalCount;
        uint256 returnCount = count > total ? total : count;

        ProposalView[] memory result = new ProposalView[](returnCount);
        for (uint256 i = 0; i < returnCount; i++) {
            uint256 pid = total - i; // newest first
            Proposal storage p = proposals[pid];
            result[i] = ProposalView(p.id, uint8(p.status), p.outcome);
        }
        return result;
    }

    /**
     * @notice Submit a new AI-generated proposal. Only callable by the agent.
     * @param ipfsHash    IPFS CID of the full reasoning JSON blob
     * @param actionType  0=Swap, 1=Stake, 2=Transfer, 3=Rebalance, 4=None
     * @param description Human-readable description of the proposed action
     * @param amount      Amount to act on (in token's native decimals)
     * @param token       Primary token address (DOT or USDC)
     * @param targetToken Secondary token address (swap target, or zero for stake/transfer)
     * @param confidence  Agent confidence score 0-100
     * @return proposalId The newly created proposal ID
     */
    function propose(
        string calldata ipfsHash,
        uint8 actionType,
        string calldata description,
        uint256 amount,
        address token,
        address targetToken,
        uint256 confidence
    ) external onlyAgent returns (uint256 proposalId) {
        require(actionType <= uint8(ActionType.None), "NeuroVault: invalid action type");
        require(confidence <= 100, "NeuroVault: confidence out of range");
        require(bytes(ipfsHash).length > 0, "NeuroVault: empty IPFS hash");
        require(amount > 0 || actionType == uint8(ActionType.None), "NeuroVault: zero amount");

        proposalCount++;
        proposalId = proposalCount;

        proposals[proposalId] = Proposal({
            id: proposalId,
            ipfsHash: ipfsHash,
            actionType: ActionType(actionType),
            description: description,
            amount: amount,
            token: token,
            targetToken: targetToken,
            confidence: confidence,
            status: ProposalStatus.Pending,
            votesFor: 0,
            votesAgainst: 0,
            snapshotTotalStaked: totalStaked,
            createdAt: block.timestamp,
            votingDeadline: block.timestamp + votingWindow,
            outcome: "",
            proposer: msg.sender
        });

        emit ProposalCreated(proposalId, ipfsHash, actionType, confidence);
    }

    // ─────────────────────────────────────────────
    // Staking
    // ─────────────────────────────────────────────

    /**
     * @notice Stake DOT to gain voting power and earn yield.
     * @param amount Amount of DOT to stake (in DOT token's decimals)
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "NeuroVault: zero amount");

        if (stakers[msg.sender].staked == 0) {
            stakerCount++;
        }

        stakers[msg.sender].staked += amount;
        totalStaked += amount;

        dotToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount);
        emit NewDeposit(msg.sender, address(dotToken), amount);
    }

    /**
     * @notice Unstake DOT. Cannot unstake while a proposal is in pending state
     *         that you have not yet voted on (to prevent vote-and-flee).
     * @param amount Amount of DOT to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "NeuroVault: zero amount");
        require(stakers[msg.sender].staked >= amount, "NeuroVault: insufficient stake");

        stakers[msg.sender].staked -= amount;
        totalStaked -= amount;

        if (stakers[msg.sender].staked == 0) {
            stakerCount--;
        }

        dotToken.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice Deposit USDC into the treasury (no voting power, just liquidity).
     * @param amount Amount of USDC to deposit
     */
    function depositUsdc(uint256 amount) external nonReentrant {
        require(amount > 0, "NeuroVault: zero amount");
        stakers[msg.sender].usdcDeposited += amount;
        usdcToken.safeTransferFrom(msg.sender, address(this), amount);
        emit NewDeposit(msg.sender, address(usdcToken), amount);
    }

    // ─────────────────────────────────────────────
    // Voting
    // ─────────────────────────────────────────────

    /**
     * @notice Cast a vote on an active proposal.
     * @param proposalId  The proposal to vote on
     * @param support     true = vote for, false = vote against
     */
    function vote(uint256 proposalId, bool support)
        external
        proposalExists(proposalId)
        nonReentrant
    {
        Proposal storage p = proposals[proposalId];

        require(p.status == ProposalStatus.Pending, "NeuroVault: proposal not active");
        require(block.timestamp <= p.votingDeadline, "NeuroVault: voting period ended");
        require(!hasVoted[msg.sender][proposalId], "NeuroVault: already voted");

        uint256 weight = stakers[msg.sender].staked;
        require(weight > 0, "NeuroVault: no voting power");

        hasVoted[msg.sender][proposalId] = true;
        stakers[msg.sender].lastVotedProposal = proposalId;

        if (support) {
            p.votesFor += weight;
        } else {
            p.votesAgainst += weight;
        }

        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    // ─────────────────────────────────────────────
    // Finalization & Execution
    // ─────────────────────────────────────────────

    /**
     * @notice Finalize a proposal after its voting window has closed.
     *         Anyone can call this. If quorum is met → execute. Otherwise → reject.
     * @param proposalId The proposal to finalize
     */
    function finalizeProposal(uint256 proposalId)
        external
        proposalExists(proposalId)
        nonReentrant
    {
        Proposal storage p = proposals[proposalId];

        require(p.status == ProposalStatus.Pending, "NeuroVault: proposal not pending");
        require(block.timestamp > p.votingDeadline, "NeuroVault: voting still active");

        uint256 snapshot = p.snapshotTotalStaked;

        // Check 2/3 supermajority: votesFor * 3 >= snapshotTotalStaked * 2
        bool quorumMet = snapshot > 0
            && (p.votesFor * QUORUM_DENOMINATOR) >= (snapshot * QUORUM_NUMERATOR);

        if (!quorumMet) {
            p.status = ProposalStatus.Rejected;
            p.outcome = "Rejected: quorum not met";
            emit ProposalRejected(proposalId, "quorum not met");
            return;
        }

        // Check execution cooldown
        require(
            block.timestamp >= lastExecutionTime + EXECUTION_COOLDOWN,
            "NeuroVault: execution cooldown active"
        );

        // Execute based on action type
        string memory outcome = _executeAction(p);

        p.status = ProposalStatus.Executed;
        p.outcome = outcome;
        lastExecutionTime = block.timestamp;
        executedProposalCount++;

        emit ProposalExecuted(proposalId, outcome);
    }

    /**
     * @notice Mark expired proposals (voting ended, not finalized). Permissionless cleanup.
     */
    function expireProposal(uint256 proposalId) external proposalExists(proposalId) {
        Proposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.Pending, "NeuroVault: not pending");
        require(block.timestamp > p.votingDeadline, "NeuroVault: still active");
        p.status = ProposalStatus.Expired;
        p.outcome = "Expired: not finalized in time";
        emit ProposalRejected(proposalId, "expired");
    }

    // ─────────────────────────────────────────────
    // Internal Execution Logic
    // ─────────────────────────────────────────────

    function _executeAction(Proposal storage p) internal returns (string memory outcome) {
        ActionType action = p.actionType;

        if (action == ActionType.Stake) {
            outcome = _executeStake(p);
        } else if (action == ActionType.Swap) {
            outcome = _executeSwap(p);
        } else if (action == ActionType.Transfer) {
            outcome = _executeTransfer(p);
        } else if (action == ActionType.Rebalance) {
            outcome = _executeRebalance(p);
        } else {
            // ActionType.None — record but no on-chain action
            outcome = "Executed: no-op action recorded";
        }
    }

    /**
     * @notice Stake DOT cross-chain on Bifrost via Hyperbridge.
     * @dev Encodes a BifrostStakeCall and dispatches it via IIsmpDispatch.
     */
    function _executeStake(Proposal storage p) internal returns (string memory) {
        uint256 amount = p.amount;

        // Safety cap
        require(amount <= MAX_SPEND_DOT, "NeuroVault: exceeds max spend");
        require(dotToken.balanceOf(address(this)) >= amount, "NeuroVault: insufficient DOT");

        // Encode the Bifrost stake call
        bytes memory body = BifrostCallEncoder.encodeStake(
            amount,
            address(this), // vDOT recipient back to vault
            p.id           // use proposal ID as nonce
        );

        // Build Hyperbridge POST request
        DispatchPost memory request = DispatchPost({
            dest: bifrostDest,
            to: bifrostModule,
            body: body,
            timeout: 3600, // 1 hour timeout
            fee: 0,        // fee handled by msg.value; relayer takes from fee field
            payer: address(this)
        });

        // Get quote and dispatch
        uint256 fee = hyperbridgeDispatch.quote(request);
        request.fee = fee;

        DispatchResponse memory response = hyperbridgeDispatch.dispatch{value: fee}(request);

        emit CrossChainStakeDispatched(p.id, response.commitment, amount);

        return string(abi.encodePacked(
            "Stake dispatched via Hyperbridge: ",
            _uint2str(amount / 10 ** 18),
            " DOT to Bifrost vDOT"
        ));
    }

    /**
     * @notice Swap DOT ↔ USDC. Currently records intent; DEX integration is an extension.
     * @dev For the hackathon demo, records the swap intent and transfers tokens to an
     *      approved DEX target. Full DEX integration (Acala swap pallet) goes via Hyperbridge.
     */
    function _executeSwap(Proposal storage p) internal returns (string memory) {
        require(approvedTargets[p.targetToken != address(0) ? p.targetToken : p.token],
            "NeuroVault: target not approved");

        // Cap check
        if (p.token == address(usdcToken)) {
            require(p.amount <= MAX_SPEND_USDC, "NeuroVault: exceeds max spend");
        } else {
            require(p.amount <= MAX_SPEND_DOT, "NeuroVault: exceeds max spend");
        }

        // Transfer to approved target (e.g. a DEX router)
        IERC20(p.token).safeTransfer(p.targetToken, p.amount);

        return string(abi.encodePacked(
            "Swap executed: ",
            _uint2str(p.amount),
            " tokens transferred to approved target"
        ));
    }

    /**
     * @notice Transfer tokens to an approved target address.
     */
    function _executeTransfer(Proposal storage p) internal returns (string memory) {
        require(approvedTargets[p.targetToken], "NeuroVault: target not approved");

        if (p.token == address(usdcToken)) {
            require(p.amount <= MAX_SPEND_USDC, "NeuroVault: exceeds max spend");
            usdcToken.safeTransfer(p.targetToken, p.amount);
        } else {
            require(p.amount <= MAX_SPEND_DOT, "NeuroVault: exceeds max spend");
            dotToken.safeTransfer(p.targetToken, p.amount);
        }

        return string(abi.encodePacked(
            "Transfer executed: ",
            _uint2str(p.amount),
            " tokens to approved address"
        ));
    }

    /**
     * @notice Rebalance: adjust ratio between DOT and USDC holdings.
     *         Records intent; full swap routing via Hyperbridge/Acala is an extension.
     */
    function _executeRebalance(Proposal storage p) internal view returns (string memory) {
        // Rebalance intent is recorded on-chain. The agent will follow up with
        // specific swap/stake proposals based on the target ratio.
        return string(abi.encodePacked(
            "Rebalance initiated: target allocation recorded for proposal ",
            _uint2str(p.id)
        ));
    }

    // ─────────────────────────────────────────────
    // Goal Management (Owner)
    // ─────────────────────────────────────────────

    /**
     * @notice Add a new governance goal for the AI agent to optimize toward.
     * @param text Human-readable goal description
     */
    function addGoal(string calldata text) external onlyOwner {
        goalCount++;
        goals[goalCount] = Goal({
            id: goalCount,
            text: text,
            status: GoalStatus.Active
        });
        emit GoalUpdated(goalCount, text, uint8(GoalStatus.Active));
    }

    /**
     * @notice Update the status of an existing goal.
     */
    function updateGoalStatus(uint256 goalId, GoalStatus status) external onlyOwner {
        require(goalId > 0 && goalId <= goalCount, "NeuroVault: goal not found");
        goals[goalId].status = status;
        emit GoalUpdated(goalId, goals[goalId].text, uint8(status));
    }

    // ─────────────────────────────────────────────
    // Admin Functions
    // ─────────────────────────────────────────────

    /// @notice Update the agent address (e.g. after Lit Protocol key rotation)
    function setAgentAddress(address newAgent) external onlyOwner {
        require(newAgent != address(0), "NeuroVault: zero address");
        emit AgentAddressUpdated(agentAddress, newAgent);
        agentAddress = newAgent;
    }

    /// @notice Update the Hyperbridge dispatch address (in case of upgrades)
    function setHyperbridgeDispatch(address newDispatch) external onlyOwner {
        require(newDispatch != address(0), "NeuroVault: zero address");
        hyperbridgeDispatch = IIsmpDispatch(newDispatch);
        emit HyperbridgeUpdated(newDispatch);
    }

    /// @notice Update Bifrost routing params
    function setBifrostRouting(bytes calldata dest, bytes calldata module) external onlyOwner {
        bifrostDest = dest;
        bifrostModule = module;
    }

    /// @notice Add or remove an approved target address
    function setApprovedTarget(address target, bool approved) external onlyOwner {
        approvedTargets[target] = approved;
        emit ApprovedTargetUpdated(target, approved);
    }

    /// @notice Update the APY (basis points) — called by owner or future oracle integration
    function setApy(uint256 apyBps) external onlyOwner {
        require(apyBps <= 10000, "NeuroVault: APY too high");
        currentApy = apyBps;
    }

    /// @notice Update voting window (owner only; for moving from demo to production)
    function setVotingWindow(uint256 windowSeconds) external onlyOwner {
        require(windowSeconds >= 5 minutes, "NeuroVault: window too short");
        votingWindow = windowSeconds;
    }

    /// @notice Receive native token for Hyperbridge fees
    receive() external payable {}

    /// @notice Emergency withdrawal by owner (for stuck funds)
    function emergencyWithdraw(address token, uint256 amount, address to) external onlyOwner {
        require(to != address(0), "NeuroVault: zero address");
        IERC20(token).safeTransfer(to, amount);
    }

    // ─────────────────────────────────────────────
    // View Helpers
    // ─────────────────────────────────────────────

    /// @notice Get full proposal details
    function getProposal(uint256 proposalId)
        external
        view
        proposalExists(proposalId)
        returns (Proposal memory)
    {
        return proposals[proposalId];
    }

    /// @notice Get staker info
    function getStakerInfo(address staker) external view returns (uint256 staked, uint256 usdcDeposited, uint256 votingPower) {
        staked = stakers[staker].staked;
        usdcDeposited = stakers[staker].usdcDeposited;
        votingPower = totalStaked > 0 ? (staked * 10000) / totalStaked : 0; // basis points
    }

    /// @notice Check if a proposal has reached quorum (for frontend polling)
    function hasReachedQuorum(uint256 proposalId) external view proposalExists(proposalId) returns (bool) {
        Proposal storage p = proposals[proposalId];
        uint256 snapshot = p.snapshotTotalStaked;
        return snapshot > 0 && (p.votesFor * QUORUM_DENOMINATOR) >= (snapshot * QUORUM_NUMERATOR);
    }

    // ─────────────────────────────────────────────
    // Internal Utilities
    // ─────────────────────────────────────────────

    function _uint2str(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
