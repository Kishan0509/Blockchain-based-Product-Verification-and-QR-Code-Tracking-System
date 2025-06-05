// Ensure Web3 is properly loaded
async function initializeWeb3() {
    if (!window.ethereum) {
        alert("❌ MetaMask is required! Please install it.");
        return null;
    }

    try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3.eth.getAccounts();
        return accounts[0]; // Return first connected account
    } catch (error) {
        console.error("❌ Web3 Initialization Error:", error);
        return null;
    }
}

// Function to register a product
async function registerProduct() {
    const name = document.getElementById("name").value.trim();
    const manufacturer = document.getElementById("manufacturer").value.trim();
    const manufacturingDate = document.getElementById("manufacturingDate").value;
    const serialNumber = document.getElementById("serialNumber").value.trim();
    const statusElement = document.getElementById("registerStatus");

    if (!name || !manufacturer || !manufacturingDate || !serialNumber) {
        statusElement.innerHTML = "⚠️ Please fill in all fields!";
        statusElement.style.color = "red";
        return;
    }

    const account = await initializeWeb3();
    if (!account) return;

    try {
        statusElement.innerHTML = "⏳ Registering product...";
        statusElement.style.color = "blue";

        const productionDate = Math.floor(new Date(manufacturingDate).getTime() / 1000);
        await contract.methods.registerProduct(serialNumber, name, manufacturer, productionDate)
            .send({ from: account });

        statusElement.innerHTML = "✅ Product registered successfully!";
        statusElement.style.color = "green";
    } catch (error) {
        console.error("❌ Error:", error);
        statusElement.innerHTML = `❌ Error: ${error.message}`;
        statusElement.style.color = "red";
    }
}

// Function to fetch product details
async function fetchProduct() {
    const serialNumber = document.getElementById("verifySerialNumber").value.trim();
    const detailsElement = document.getElementById("productDetails");

    if (!serialNumber) {
        detailsElement.innerHTML = "⚠️ Please enter a serial number.";
        detailsElement.style.color = "red";
        return;
    }

    try {
        detailsElement.innerHTML = "⏳ Fetching product details...";
        detailsElement.style.color = "blue";

        const product = await contract.methods.getProduct(serialNumber).call();

        if (product && product.length > 0) {
            detailsElement.innerHTML = `
                <strong>Serial Number:</strong> ${serialNumber} <br>
                <strong>Product Name:</strong> ${product[0]} <br>
                <strong>Manufacturer:</strong> ${product[1]} <br>
                <strong>Manufacturing Date:</strong> ${new Date(product[2] * 1000).toLocaleDateString()} <br>
                <strong>Status:</strong> ${product[3]}
            `;
            detailsElement.style.color = "black";
        } else {
            detailsElement.innerHTML = "❌ No product found!";
            detailsElement.style.color = "red";
        }
    } catch (error) {
        console.error("❌ Error:", error);
        detailsElement.innerHTML = `❌ Error: ${error.message}`;
        detailsElement.style.color = "red";
    }
}

// Function to update product status
async function updateStatus() {
    const serialNumber = document.getElementById("updateSerialNumber").value.trim();
    const newStatus = document.getElementById("newStatus").value.trim();
    const statusMessage = document.getElementById("updateStatusMessage");

    if (!serialNumber || !newStatus) {
        statusMessage.innerHTML = "⚠️ Please fill in all fields!";
        statusMessage.style.color = "red";
        return;
    }

    const account = await initializeWeb3();
    if (!account) return;

    try {
        statusMessage.innerHTML = "⏳ Updating status...";
        statusMessage.style.color = "blue";

        await contract.methods.updateProductStatus(serialNumber, newStatus)
            .send({ from: account });

        statusMessage.innerHTML = "✅ Status updated successfully!";
        statusMessage.style.color = "green";
    } catch (error) {
        console.error("❌ Error:", error);
        statusMessage.innerHTML = `❌ Error: ${error.message}`;
        statusMessage.style.color = "red";
    }
}
