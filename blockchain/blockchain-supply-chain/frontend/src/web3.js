import Web3 from "web3";
import contractABI from "./contractABI.json"; // Ensure ABI is correct
import { contractAddress } from "./config";  // Import updated contract address

let web3 = null;
let contract = null;
let userAccount = null;

// ✅ Initialize Web3 and Contract
const loadWeb3 = async () => {
    if (!window.ethereum) {
        console.error("❌ No Ethereum provider found. Install MetaMask.");
        alert("❌ MetaMask is required to use this application.");
        return null;
    }

    try {
        // ✅ Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });

        // ✅ Initialize Web3 if not already set
        if (!web3) {
            web3 = new Web3(window.ethereum);
            contract = new web3.eth.Contract(contractABI, contractAddress);
        }

        // ✅ Fetch connected accounts
        const accounts = await web3.eth.getAccounts();
        if (accounts.length === 0) {
            console.warn("⚠️ No accounts found. Please connect MetaMask.");
            return null;
        }

        userAccount = accounts[0];

        // console.log("✅ Web3 Initialized:", web3);
        // console.log("✅ Smart Contract Loaded:", contract);
        // console.log("✅ Connected Wallet:", userAccount);

        return userAccount;
    } catch (error) {
        console.error("❌ Error loading Web3:", error);
        alert("✅ Connected with MetaMask. Check console for details.");
        return null;
    }
};

// ✅ Listen for Account & Network Changes
const listenForAccountChanges = () => {
    if (window.ethereum) {
        window.ethereum.on("accountsChanged", async (accounts) => {
            if (accounts.length > 0) {
                userAccount = accounts[0];
                console.log("🔄 Account Changed:", userAccount);
            } else {
                userAccount = null;
                console.warn("⚠️ No connected accounts.");
                alert("⚠️ Please connect to MetaMask.");
            }
        });

        window.ethereum.on("chainChanged", async () => {
            console.log("🔄 Network changed. Reloading Web3...");
            window.location.reload();
        });
    }
};

// ✅ Auto-Initialize Web3 on Load
(async () => {
    const account = await loadWeb3();
    if (account) listenForAccountChanges();
})();

export { loadWeb3, listenForAccountChanges, web3, contract, userAccount };
