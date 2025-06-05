import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Line, Pie } from "react-chartjs-2";
import { FaBox, FaCheckCircle, FaHourglassHalf, FaSearch, FaChevronDown } from "react-icons/fa";
import { ThreeDots } from 'react-loader-spinner'; 
import { motion } from 'framer-motion';  
import "./dashboard.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Card = ({ title, count, onClick }) => (
  <div className="dashboard__card" onClick={onClick}>
    <div className="card__content">
      <h4>{title}</h4>
      <div className="card__value">{count}</div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const { user } = useContext(AuthContext);
  const [userCount, setUserCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [manufacturerCount, setManufacturerCount] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);
  const [retailerCount, setRetailerCount] = useState(0);
  const [registrationData, setRegistrationData] = useState([]);
  const [selectedList, setSelectedList] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");


  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { "x-auth-token": token };

    const fetchCounts = async () => {
      try {
        const [userRes, roleRes, productRes, productRegRes] = await Promise.all(
          [
            fetch(`${API_BASE_URL}/api/admin/users/count`, { headers }),
            fetch(`${API_BASE_URL}/api/admin/users/count-by-role`, {
              headers,
            }),
            fetch(`${API_BASE_URL}/api/admin/products/count`, {
              headers,
            }),
            fetch(`${API_BASE_URL}/api/admin/products/registered-dates`, {
              headers,
            }),
          ]
        );

        if (userRes.ok) setUserCount((await userRes.json()).count);
        if (productRes.ok) setProductCount((await productRes.json()).count);
        if (roleRes.ok) {
          const data = await roleRes.json();
          setManufacturerCount(data.manufacturers);
          setSupplierCount(data.suppliers);
          setRetailerCount(data.retailers);
        }
        if (productRegRes.ok) setRegistrationData(await productRegRes.json());
      } catch (err) {
        console.error("Error loading admin data:", err);
      }
    };

    if (user?.role === "admin") {
      fetchCounts();
    }
  }, [user]);

  const fetchList = async (type) => {
    const token = localStorage.getItem("token");
    let url = "";

    switch (type) {
      case "manufacturers":
      case "suppliers":
      case "retailers":
        url = `${API_BASE_URL}/api/admin/users/list/${type.slice(0, -1)}`;
        break;
      case "products":
        url = `${API_BASE_URL}/api/admin/products/list`;
        break;
      default:
        return;
    }

    try {
      const res = await fetch(url, { headers: { "x-auth-token": token } });
      if (res.ok) {
        const data = await res.json();
        setSelectedList(data);
        setSelectedType(type);
      }
    } catch (err) {
      console.error("Error fetching list:", err);
    }
  };

  const lineData = {
    labels: registrationData.map((d) => d._id),
    datasets: [
      {
        label: "Product Registrations",
        data: registrationData.map((d) => d.count),
        fill: true,
        backgroundColor: "rgba(75,192,192,0.2)",
        borderColor: "rgba(75,192,192,1)",
      },
    ],
  };

  const doughnutData = {
    labels: ["Manufacturers", "Suppliers", "Retailers"],
    datasets: [
      {
        label: "User Roles",
        data: [manufacturerCount, supplierCount, retailerCount],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(54, 162, 235, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(54, 162, 235, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#333",
          font: { size: 14 },
        },
      },
    },
  };

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h2>📊 Admin Dashboard</h2>
      </div>

      <div className="dashboard__cards">
        <motion.div
          className="dashboard__card"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="card__content">
            <h4>Total Users</h4>
            <div className="card__value">{userCount}</div>
          </div>
        </motion.div>

        {[
          {
            title: "🏭 Manufacturers",
            count: manufacturerCount,
            type: "manufacturers",
          },
          { title: "🚚 Suppliers", count: supplierCount, type: "suppliers" },
          { title: "🏬 Retailers", count: retailerCount, type: "retailers" },
          { title: "📦 Products", count: productCount, type: "products" },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            className="dashboard__card"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            onClick={() => fetchList(item.type)}
          >
            <div className="card__content">
              <h4>{item.title}</h4>
              <div className="card__value">{item.count}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="dashboard__charts">
        <div className="chart__card">
          <div className="chart__header">
            <h4>Product Registrations Over Time</h4>
          </div>
          <div className="chart__container">
            <Line data={lineData} />
          </div>
        </div>

        <div className="chart__card">
          <div className="chart__header">
            <h4>User Role Distribution</h4>
          </div>
          <div className="chart__container pie">
            <Pie data={doughnutData} options={pieOptions} />
          </div>
        </div>
      </div>

      <div className="dashboard__products">
        <div className="products__header">
          <h3>
            {selectedType
              ? `List of ${
                  selectedType.charAt(0).toUpperCase() + selectedType.slice(1)
                }`
              : "User/Product List"}
          </h3>
          <div className="products__filters">
            <div className="products__search">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {selectedList.length > 0 && (
          <table className="products__table">
            <thead>
              <tr>
                {selectedType === "products" ? (
                  <>
                    <th>Serial Number</th>
                    <th>Name</th>
                    <th>Manufacturer</th>
                    <th>Quantity</th>
                    <th>Registered On</th>
                  </>
                ) : (
                  <>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {selectedList.map((item, idx) => (
                <tr key={idx}>
                  {selectedType === "products" ? (
                    <>
                      <td>{item.serialNumber}</td>
                      <td>{item.name}</td>
                      <td>{item.manufacturer}</td>
                      <td>{item.quantity}</td>
                      <td>{new Date(item.timestamp).toLocaleDateString()}</td>
                    </>
                  ) : (
                    <>
                      <td>{item.name}</td>
                      <td>{item.email}</td>
                      <td>{item.status}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
