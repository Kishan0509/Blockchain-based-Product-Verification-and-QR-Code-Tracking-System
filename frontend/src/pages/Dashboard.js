import React, { useContext } from "react";
import AuthContext from "../context/AuthContext";
import AdminDashboard from "../components/AdminDashboard";
import ManufacturerDashboard from "../components/ManufacturerDashboard";
import SupplierDashboard from "../components/SupplierDashboard";
import RetailerDashboard from "../components/RetailerDashboard";

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user) return <p>Please login to view your dashboard.</p>;
  if (!user) {
    return <p>Loading...</p>; 
  }

  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "manufacturer":
      return <ManufacturerDashboard />;
    case "supplier":
      return <SupplierDashboard />;
    case "retailer":
      return <RetailerDashboard />;
    default:
      return <p>Unknown role. Please contact support.</p>;
  }

};

export default Dashboard;
