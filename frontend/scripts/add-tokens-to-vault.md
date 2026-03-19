# Adding DOT and USDC to NeuroVault

## Prerequisites
1. Connected to Paseo testnet (chainId: 420420417)
2. Have DOT and USDC test tokens in your wallet
3. Wallet connected to the app

## Method 1: Using the Frontend UI

### Add DOT
1. Go to `/app/stake` page
2. Click "Deposit" tab
3. Select "DOT" token
4. Enter amount (e.g., 100)
5. Click "Deposit" button
6. Approve the transaction in MetaMask (2 transactions):
   - First: Approve NeuroVault to spend your DOT
   - Second: Stake DOT into the vault

### Add USDC
Currently, the contract only supports DOT staking directly. USDC is held in the treasury but not staked by users.

## Method 2: Using Ethers.js Script

Create a script to deposit tokens programmatically:

```typescript
import { ethers } from "ethers";

const NEUROVAULT_ADDRESS = "0xC6D07643f95a8eaC299299e2eb895DF0088354Ed";
const DOT_ADDRESS = "0x8caC5028A31bC2aF5f8A99A7555C62057eE7fEFE";

async function addDotToVault(amount: string) {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  // DOT token contract
  const dotToken = new ethers.Contract(
    DOT_ADDRESS,
    ["function approve(address spender, uint256 amount) returns (bool)"],
    signer
  );
  
  // NeuroVault contract
  const vault = new ethers.Contract(
    NEUROVAULT_ADDRESS,
    ["function stake(uint256 amount)"],
    signer
  );
  
  const parsedAmount = ethers.parseUnits(amount, 18);
  
  // Approve
  console.log("Approving DOT...");
  const approveTx = await dotToken.approve(NEUROVAULT_ADDRESS, parsedAmount);
  await approveTx.wait();
  console.log("Approved!");
  
  // Stake
  console.log("Staking DOT...");
  const stakeTx = await vault.stake(parsedAmount);
  await stakeTx.wait();
  console.log("Staked successfully!");
}

// Usage
addDotToVault("100"); // Stake 100 DOT
```

## Method 3: Direct Contract Interaction

If you need to send USDC directly to the vault (for treasury management):

```typescript
async function sendUsdcToVault(amount: string) {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  const usdcToken = new ethers.Contract(
    "0xc394f94c7B93AE269F7AABDeca736A7b7768a388",
    ["function transfer(address to, uint256 amount) returns (bool)"],
    signer
  );
  
  const parsedAmount = ethers.parseUnits(amount, 6); // USDC has 6 decimals
  
  const tx = await usdcToken.transfer(NEUROVAULT_ADDRESS, parsedAmount);
  await tx.wait();
  console.log("USDC sent to vault!");
}
```

## Getting Test Tokens

### Option 1: Faucet
Contact the Paseo testnet team for test tokens.

### Option 2: Deploy Mock Tokens (Development)
If you need to test locally, you can deploy mock ERC20 tokens:

```solidity
// MockERC20.sol
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**18);
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

## Verify Deposits

After depositing, verify on the app:
1. Go to `/app` page
2. Check "Your Position" section shows your staked amount
3. Check "Voting Power" percentage
4. Treasury balances should update

## Troubleshooting

### "Insufficient balance"
- Make sure you have enough DOT/USDC in your wallet
- Check you're on Paseo testnet

### "Approval failed"
- Increase gas limit in MetaMask
- Make sure you have PAS for gas fees

### "Transaction reverted"
- Check you're approving the correct contract address
- Verify amount is greater than 0
- Ensure you have enough tokens
