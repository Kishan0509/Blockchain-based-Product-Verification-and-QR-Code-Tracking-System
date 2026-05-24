// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProductTracking {
    struct Product {
        string name;
        string manufacturer;
        string serialNumber;
        string status;
        uint256 timestamp;
        address owner;
    }

    mapping(string => Product) public products;
    address public admin;

    event ProductRegistered(string serialNumber, string name, string manufacturer);
    event ProductUpdated(string serialNumber, string status);

    constructor() {
        admin = msg.sender;
    }

    // ✅ Allow any user to register products (Removed `onlyAdmin`)
    function registerProduct(string memory _serialNumber, string memory _name, string memory _manufacturer) public {
        require(bytes(products[_serialNumber].serialNumber).length == 0, "Product already registered");

        products[_serialNumber] = Product({
            name: _name,
            manufacturer: _manufacturer,
            serialNumber: _serialNumber,
            status: "Manufactured",
            timestamp: block.timestamp,
            owner: msg.sender  // ✅ The product is owned by the user who registered it
        });

        emit ProductRegistered(_serialNumber, _name, _manufacturer);
    }

    // ✅ Mass Product Registration (Multiple products at once)
    function registerProducts(
        string[] memory _serialNumbers,
        string[] memory _names,
        string[] memory _manufacturers
    ) public {
        require(
            _serialNumbers.length == _names.length && _names.length == _manufacturers.length,
            "Input array lengths must match"
        );

        for (uint256 i = 0; i < _serialNumbers.length; i++) {
            require(bytes(products[_serialNumbers[i]].serialNumber).length == 0, "Product already registered");

            products[_serialNumbers[i]] = Product({
                name: _names[i],
                manufacturer: _manufacturers[i],
                serialNumber: _serialNumbers[i],
                status: "Manufactured",
                timestamp: block.timestamp,
                owner: msg.sender
            });

            emit ProductRegistered(_serialNumbers[i], _names[i], _manufacturers[i]);
        }
    }

    // ✅ Allow only product owners or admin to update the status
    function updateProductStatus(string memory _serialNumber, string memory _status) public {
        require(bytes(products[_serialNumber].serialNumber).length != 0, "Product not found");
        require(msg.sender == products[_serialNumber].owner || msg.sender == admin, "Unauthorized: Not owner or admin");

        products[_serialNumber].status = _status;
        products[_serialNumber].timestamp = block.timestamp;

        emit ProductUpdated(_serialNumber, _status);
    }

    function getProductDetails(string memory _serialNumber)
        public
        view
        returns (string memory, string memory, string memory, string memory, uint256, address)
    {
        require(bytes(products[_serialNumber].serialNumber).length != 0, "Product not found");

        Product memory p = products[_serialNumber];
        return (p.name, p.manufacturer, p.serialNumber, p.status, p.timestamp, p.owner);
    }
}
