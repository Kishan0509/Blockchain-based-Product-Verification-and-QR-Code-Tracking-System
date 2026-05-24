const ProductTraceability = artifacts.require("ProductTraceability");

module.exports = function (deployer) {
    deployer.deploy(ProductTraceability);
};