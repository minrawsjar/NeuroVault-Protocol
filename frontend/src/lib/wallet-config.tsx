import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "demo-project-id";
const hasValidWalletConnectProjectId = projectId !== "demo-project-id";

export const config = createConfig({
	chains: [mainnet, sepolia],
	connectors: hasValidWalletConnectProjectId
		? [injected(), walletConnect({ projectId })]
		: [injected()],
	transports: {
		[mainnet.id]: http(),
		[sepolia.id]: http(),
	},
});