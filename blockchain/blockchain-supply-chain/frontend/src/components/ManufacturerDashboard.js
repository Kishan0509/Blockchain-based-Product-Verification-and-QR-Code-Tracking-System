import React, { useEffect, useState } from "react";
import { Line, Pie } from "react-chartjs-2";
import {
  FaBox,
  FaCheckCircle,
  FaHourglassHalf,
  FaSearch,
  FaChevronDown,
} from "react-icons/fa";
import { ThreeDots } from "react-loader-spinner"; 
import { motion } from "framer-motion"; 
import "./dashboard.css";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  ArcElement
);

const ManufacturerDashboard = () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [updatedBySupplier, setUpdatedBySupplier] = useState(0);
  const [notUpdatedBySupplier, setNotUpdatedBySupplier] = useState(0);
  const [chartData, setChartData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [loading, setLoading] = useState(true); // Track loading state

  const token = localStorage.getItem("token");

  // useEffect(() => {
  //   fetchDashboardData();
  //   fetchProductList();
  //   fetchChartData();
  // }, []);

    useEffect(() => {
    const fetchData = async () => {
      await fetchDashboardData();
      await fetchProductList();
      await fetchChartData();
      setLoading(false); // Set loading to false once data is fetched
    };
    fetchData();
  }, []);



  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/dashboard`, {
        headers: { "x-auth-token": token },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setTotalProducts(data.totalProducts);
      setUpdatedBySupplier(data.updatedBySupplier);
      setNotUpdatedBySupplier(data.notUpdatedBySupplier);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  const fetchProductList = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/products`, {
        headers: { "x-auth-token": token },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch product list:", error);
    }
  };

  const fetchChartData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/registered-dates`, {
        headers: { "x-auth-token": token },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const labels = data.map((entry) => entry._id);
      const values = data.map((entry) => entry.count);
      setChartData({
        labels,
        datasets: [
          {
            label: "Products Registered",
            data: values,
            fill: true,
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            tension: 0.4,
          },
        ],
      });
    } catch (error) {
      console.error("Failed to fetch chart data:", error);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterRole === "all" ||
      product.history.some((h) => h.role === filterRole);
    return matchesSearch && matchesFilter;
  });

  const pieChartData = {
    labels: ["Updated by Supplier", "Not Updated"],
    datasets: [
      {
        label: "Supplier Update Status",
        data: [updatedBySupplier, notUpdatedBySupplier],
        backgroundColor: ["#4BC0C0", "#FF6384"],
        borderColor: ["#fff", "#fff"],
        borderWidth: 1,
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h2>Manufacturer Dashboard</h2>
      </div>

      {/* Cards */}
      <div className="dashboard__cards">
        <div className="dashboard__card">
          <div className="card__content">
            <h4>Total Products</h4>
            <div className="card__value">{totalProducts}</div>
          </div>
          <div className="card__icon"><FaBox /></div>
        </div>

        <div className="dashboard__card">
          <div className="card__content">
            <h4>Updated by Supplier</h4>
            <div className="card__value">{updatedBySupplier}</div>
          </div>
          <div className="card__icon"><FaCheckCircle /></div>
        </div>

        <div className="dashboard__card">
          <div className="card__content">
            <h4>Not Updated</h4>
            <div className="card__value">{notUpdatedBySupplier}</div>
          </div>
          <div className="card__icon"><FaHourglassHalf /></div>
        </div>
      </div>

      {/* Charts */}
      <div className="dashboard__charts">
        <div className="chart__card">
          <div className="chart__header">
            <h4>Product Registration Trend</h4>
            <select className="chart__filter">
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="chart__container">
            {chartData.labels ? (
              <Line data={chartData} options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                },
              }} />
            ) : (
              <p>Loading chart...</p>
            )}
          </div>
        </div>

        <div className="chart__card">
          <div className="chart__header">
            <h4>Supplier Update Status</h4>
          </div>
          <div className="chart__container pie">
            <Pie data={pieChartData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'right' },
              },
            }} />
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="dashboard__products">
        <div className="products__header">
          <h3>Your Manufactured Products</h3>
          <div className="products__filters">
            <div className="products__search">
              <FaSearch className="icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="products__select">
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="supplier">Supplier</option>
                <option value="retailer">Retailer</option>
              </select>
              <FaChevronDown className="icon" />
            </div>
          </div>
        </div>

        <div className="products__table-wrapper">
          <table className="products__table">
            <thead>
              <tr>
                <th>Serial Number</th>
                <th>Name</th>
                <th>Quantity</th>
                <th>Production Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => {
                  const manufacturerHistory = product.history?.find(
                    (h) => h.role === "manufacturer"
                  );
                  const productionDate = manufacturerHistory?.transferredAt
                    ? new Date(manufacturerHistory.transferredAt).toLocaleDateString()
                    : "N/A";
                  const isUpdated = product.history?.some(h => h.role === "supplier");

                  return (
                    <tr key={index}>
                      <td>{product.serialNumber}</td>
                      <td>{product.name}</td>
                      <td>{product.quantity || "N/A"}</td>
                      <td>{productionDate}</td>
                      <td>
                        <span className={`status ${isUpdated ? "updated" : "pending"}`}>
                          {isUpdated ? "Updated" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">No products found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManufacturerDashboard;