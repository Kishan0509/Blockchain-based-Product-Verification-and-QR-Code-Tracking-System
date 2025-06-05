require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    amoy: {
      url: "https://polygon-amoy.infura.io/v3/6a7619da9c7940dfaebdcfc69385f6fc", // Replace with your Infura RPC
      accounts: [`5047845362912ae63904ad20d24691207e118a82ebe298fc67ea602ef7c29c0e`] // Replace with your private key
    }
  },
  etherscan: {
    apiKey: "DIBYCWJ1DB4DR5AWPY5ICUK2TTUUHBR2DN" // Replace with your Polygonscan API Key
  }
};
