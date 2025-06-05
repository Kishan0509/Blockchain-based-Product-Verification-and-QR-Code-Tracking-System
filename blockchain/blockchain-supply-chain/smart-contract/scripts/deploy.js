const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying ProductTracking contract...");

  // Get the contract factory
  const ProductTracking = await ethers.getContractFactory("ProductTracking");

  // Deploy the contract
  const productTracking = await ProductTracking.deploy();

  // Wait for the contract to be deployed
  await productTracking.waitForDeployment();

  // Get contract address
  const contractAddress = await productTracking.getAddress();
  
  console.log(`✅ Contract deployed successfully at: ${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
