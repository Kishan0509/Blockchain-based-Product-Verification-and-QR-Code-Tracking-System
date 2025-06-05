import { ethers } from "ethers";
import contractABI from "./contracts/ProductTraceability.json";

// ✅ Contract Address
export const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS

// ✅ Network Chain ID (Change this based on your blockchain network)
const NETWORK_ID = "0x13881"; // Polygon Mumbai Testnet (Example)

// ✅ Function to get blockchain connection
export const getBlockchain = async () => {
    if (!window.ethereum) {
        alert("🦊 MetaMask is required! Please install it.");
        return null;
    }

    try {
        // ✅ Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });

        // ✅ Validate network connection
        const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
        if (currentChainId !== NETWORK_ID) {
            alert("⚠️ Please switch to the correct blockchain network.");
            return null;
        }

        // ✅ Create provider and signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // ✅ Create and return the contract instance
        const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);

        console.log("✅ Connected to blockchain:", contract);
        return contract;
    } catch (error) {
        console.error("🚨 Error connecting to blockchain:", error);
        alert("❌ Failed to connect to the blockchain. Check the console for details.");
        return null;
    }
};

// ✅ Listen for Account & Network Changes
export const listenForBlockchainEvents = () => {
    if (window.ethereum) {
        window.ethereum.on("accountsChanged", async (accounts) => {
            if (accounts.length > 0) {
                console.log("🔄 Account Changed:", accounts[0]);
            } else {
                console.warn("⚠️ MetaMask is locked or account disconnected.");
            }
        });

        window.ethereum.on("chainChanged", async () => {
            console.log("🔄 Network changed. Reloading...");
            window.location.reload();
        });
    }
};

// ✅ Auto-Initialize Event Listeners
listenForBlockchainEvents();
