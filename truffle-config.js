module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Localhost (default for Ganache)
      port: 8545,        // Default Ganache port
      network_id: "5777",   // Match any network ID (or use 5777 for Ganache)
    },
  },

  compilers: {
    solc: {
      version: "0.8.21", // Use the same version as in your contract
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};