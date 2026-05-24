import React, { useEffect, useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { FaBox, FaCheckCircle, FaHourglassHalf, FaSearch, FaChevronDown } from "react-icons/fa";
import { ThreeDots } from 'react-loader-spinner';  
import { motion } from 'framer-motion';  
import './dashboard.css';

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, ArcElement);

const SupplierDashboard = () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [updatedByRetailer, setUpdatedByRetailer] = useState(0);
  const [notUpdatedByRetailer, setNotUpdatedByRetailer] = useState(0);
  const [chartData, setChartData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDashboardData();
    fetchProductList();
    fetchChartData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/dashboard`, {
        headers: {
          'x-auth-token': token,
        },
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();

      if (data.role === 'supplier') {
        setTotalProducts(data.totalProducts);
        setUpdatedByRetailer(data.updatedByRetailer);
        setNotUpdatedByRetailer(data.notUpdatedByRetailer);
      }
    } catch (error) {
      console.error('Error fetching supplier dashboard data:', error);
    }
  };

  const fetchProductList = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/products`, {
        headers: {
          'x-auth-token': token,
        },
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching supplier products:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/registered-dates`, {
        headers: {
          'x-auth-token': token,
        },
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();
      const labels = data.map((d) => d._id);
      const values = data.map((d) => d.count);

      setChartData({
        labels,
        datasets: [
          {
            label: 'Products Received',
            data: values,
            borderColor: 'green',
            fill: false,
            tension: 0.1,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterRole === 'all' ||
      product.history.some((h) => h.role === filterRole);

    return matchesSearch && matchesFilter;
  });

  const pieChartData = {
    labels: ['Updated by Retailer', 'Not Yet Updated'],
    datasets: [
      {
        label: 'Retailer Update Status',
        data: [updatedByRetailer, notUpdatedByRetailer],
        backgroundColor: ['#4CAF50', '#FFC107'],
        hoverOffset: 4,
      },
    ],
  };

  return (
  <div className="dashboard">
    <div className="dashboard__header">
      <h2>Supplier Dashboard</h2>
    </div>

    {/* Animated Stat Cards */}
    <div className="dashboard__cards">
      <motion.div className="dashboard__card" whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
        <div className="card__content">
          <h4>Total Products Received</h4>
          <div className="card__value">{totalProducts}</div>
        </div>
        <div className="card__icon"><FaBox /></div>
      </motion.div>

      <motion.div className="dashboard__card" whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
        <div className="card__content">
          <h4>Updated by Retailer</h4>
          <div className="card__value">{updatedByRetailer}</div>
        </div>
        <div className="card__icon"><FaCheckCircle /></div>
      </motion.div>

      <motion.div className="dashboard__card" whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
        <div className="card__content">
          <h4>Not Yet Updated</h4>
          <div className="card__value">{notUpdatedByRetailer}</div>
        </div>
        <div className="card__icon"><FaHourglassHalf /></div>
      </motion.div>
    </div>

    {/* Charts */}
    <div className="dashboard__charts">
      <div className="chart__card">
        <div className="chart__header">
          <h4>Product Receipt Trend</h4>
          <select className="chart__filter">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
          </select>
        </div>
        <div className="chart__container">
          {chartData.labels ? (
            <Line
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                  tooltip: {
                    callbacks: {
                      label: (tooltipItem) => `Received: ${tooltipItem.raw}`,
                    },
                  },
                },
              }}
            />
          ) : (
            <p>Loading chart...</p>
          )}
        </div>
      </div>

      <div className="chart__card">
        <div className="chart__header">
          <h4>Retailer Update Status</h4>
        </div>
        <div className="chart__container pie">
          <Pie
            data={pieChartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'right' },
                tooltip: {
                  callbacks: {
                    label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw}%`,
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>

    {/* Product Table with Search and Filter */}
    <div className="dashboard__products">
      <div className="products__header">
        <h3>Received Products</h3>
        <div className="products__filters">
          <div className="products__search">
            <FaSearch className="icon" />
            <input
              type="text"
              placeholder="Search by name or serial number"
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
              <th>Manufacturer</th>
              <th>Received At</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p, idx) => {
                const supplierEntry = p.history?.find((h) => h.role === 'supplier');
                return (
                  <tr key={idx}>
                    <td>{p.serialNumber}</td>
                    <td>{p.name}</td>
                    <td>{p.manufacturer || 'N/A'}</td>
                    <td>
                      {supplierEntry?.transferredAt
                        ? new Date(supplierEntry.transferredAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="no-data">No products received yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

};

export default SupplierDashboard;
