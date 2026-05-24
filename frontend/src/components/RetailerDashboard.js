import React, { useEffect, useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import {
  FaBox,
  FaCheckCircle,
  FaHourglassHalf,
  FaSearch,
  FaChevronDown
} from 'react-icons/fa';
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

const RetailerDashboard = () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const [productCount, setProductCount] = useState(0);
  const [updatedByRetailer, setUpdatedByRetailer] = useState(0);
  const [notUpdatedByRetailer, setNotUpdatedByRetailer] = useState(0);
  const [products, setProducts] = useState([]);
  const [chartData, setChartData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [role, setRole] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDashboardData();
    fetchProductList();
    fetchChartData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/dashboard`, {
        headers: { 'x-auth-token': token },
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();
      setRole(data.role);
      setProductCount(data.totalProducts || 0);

      if (data.role !== 'retailer') {
        setUpdatedByRetailer(data.updatedByRetailer || 0);
        setNotUpdatedByRetailer(data.notUpdatedByRetailer || 0);
      }
    } catch (error) {
      console.error('Error fetching retailer dashboard data:', error);
    }
  };

  const fetchProductList = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/products`, {
        headers: { 'x-auth-token': token },
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching retailer products:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/registered-dates`, {
        headers: { 'x-auth-token': token },
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();
      const labels = data.map((d) => d._id);
      const values = data.map((d) => d.count);

      setChartData({
        labels,
        datasets: [
          {
            label: 'Products Registered',
            data: values,
            fill: true,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.4,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.manufacturer && product.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'updated' && product.history?.some(h => h.role === 'retailer')) ||
      (filterStatus === 'not-updated' && !product.history?.some(h => h.role === 'retailer'));

    return matchesSearch && matchesFilter;
  });

  const pieChartData = {
    labels: ['Updated by Retailer', 'Not Updated'],
    datasets: [
      {
        label: 'Retailer Update Status',
        data: [updatedByRetailer, notUpdatedByRetailer],
        backgroundColor: ['#4BC0C0', '#FF6384'],
        borderColor: ['#fff', '#fff'],
        borderWidth: 1,
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h2>Retailer Dashboard</h2>
      </div>

      {/* Stat Cards */}
      <div className="dashboard__cards">
        <motion.div
          className="dashboard__card"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="card__content">
            <h4>{role === 'retailer' ? 'Products Received' : 'Total Products'}</h4>
            <div className="card__value">{productCount}</div>
          </div>
          <div className="card__icon"><FaBox /></div>
        </motion.div>

        {role !== 'retailer' && (
          <>
            <motion.div
              className="dashboard__card"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="card__content">
                <h4>Updated by Retailer</h4>
                <div className="card__value">{updatedByRetailer}</div>
              </div>
              <div className="card__icon"><FaCheckCircle /></div>
            </motion.div>

            <motion.div
              className="dashboard__card"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="card__content">
                <h4>Not Updated</h4>
                <div className="card__value">{notUpdatedByRetailer}</div>
              </div>
              <div className="card__icon"><FaHourglassHalf /></div>
            </motion.div>
          </>
        )}
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
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                  },
                }}
              />
            ) : (
              <p>Loading chart...</p>
            )}
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="dashboard__products">
        <div className="products__header">
          <h3>Registered Products</h3>
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
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="updated">Updated</option>
                <option value="not-updated">Not Updated</option>
              </select>
              <FaChevronDown className="select-arrow" />
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
                <th>Registered At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => {
                  const isUpdated = product.history?.some(h => h.role === 'retailer');
                  return (
                    <tr key={index}>
                      <td>{product.serialNumber}</td>
                      <td>{product.name}</td>
                      <td>{product.manufacturer || 'N/A'}</td>
                      <td>{product.timestamp ? new Date(product.timestamp).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <span className={`status ${isUpdated ? 'updated' : 'pending'}`}>
                          {isUpdated ? 'Updated' : 'Pending'}
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

export default RetailerDashboard;

