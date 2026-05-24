import { Network, Alchemy } from "alchemy-sdk";
import dotenv from "dotenv"; // Load environment variables

dotenv.config(); // Load .env file

// ✅ Validate API Key before initializing
if (!process.env.ALCHEMY_API_KEY) {
  console.error("❌ ALCHEMY_API_KEY is missing! Please check your .env file.");
  process.exit(1); // Stop execution if API key is missing
}

const settings = {
  apiKey: process.env.ALCHEMY_API_KEY, // Securely load API key
  network: Network.MATIC_AMOY, // Amoy Testnet for Polygon PoS
};

const alchemy = new Alchemy(settings);

// ✅ Function to fetch latest block dynamically
const getLatestBlock = async () => {
  try {
    const latestBlock = await alchemy.core.getBlockNumber();
    console.log(`✅ Latest Block: ${latestBlock}`);
    return latestBlock;
  } catch (error) {
    console.error("❌ Error fetching latest block:", error);
  }
};

// ✅ Example: Fetch specific block details
const getBlockDetails = async (blockNumber) => {
  try {
    const block = await alchemy.core.getBlock(blockNumber);
    console.log(`✅ Block ${blockNumber} Details:`, block);
  } catch (error) {
    console.error(`❌ Error fetching block ${blockNumber}:`, error);
  }
};

// Fetch and log latest block details
(async () => {
  const latestBlock = await getLatestBlock();
  if (latestBlock) {
    await getBlockDetails(latestBlock);
  }
})();

export { getLatestBlock, getBlockDetails, alchemy };
