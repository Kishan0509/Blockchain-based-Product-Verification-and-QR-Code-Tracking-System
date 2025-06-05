const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api/"; // ✅ Use environment variable for flexibility

// ✅ Reusable Fetch Wrapper
const fetchWrapper = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `API Error: ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error(`❌ API Request Failed (${endpoint}):`, error.message);
        return { success: false, message: error.message || "API request failed" };
    }
};

// ✅ Register a Product
export const registerProduct = async (serialNumber, name, manufacturer) => {
    if (!serialNumber || !name || !manufacturer) {
        return { success: false, message: "Missing required fields" };
    }

    return fetchWrapper("registerProduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serialNumber, name, manufacturer })
    });
};

// ✅ Get Product Details
export const getProductDetails = async (serialNumber) => {
    if (!serialNumber) {
        return { success: false, message: "Serial number is required" };
    }

    return fetchWrapper(`getProduct/${serialNumber}`);
};

// ✅ Update Product Status
export const updateProductStatus = async (serialNumber, newStatus) => {
    if (!serialNumber || !newStatus) {
        return { success: false, message: "Missing required fields" };
    }

    return fetchWrapper("updateStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serialNumber, newStatus })
    });
};
