module.exports = {
  resolve: {
    fallback: {
      "fs": false, // ✅ Prevents unnecessary polyfill for 'fs'
      "path": require.resolve("path-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "crypto": require.resolve("crypto-browserify"), // ✅ Required for Web3/ethers.js
      "stream": require.resolve("stream-browserify"),
    },
  },
};
