import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";
import AuthContext from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import RegisterProduct from "./pages/RegisterProduct";
import Search from "./pages/Search";
import UpdateStatus from "./pages/UpdateStatus";
import AdminPanel from "./pages/AdminPanel";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import { Navigate } from "react-router-dom";


const AppRoutes = () => {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
       <Route path="/" element={user ? <Dashboard/> : <Login />} />

      <Route path="/login" element={<Login />} />
      <Route path="/SignUp" element={<SignUp />} />

      <Route
        path="/register" element={ <ProtectedRoute roles={["admin", "manufacturer"]}><RegisterProduct /></ProtectedRoute>}/>

      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
      <Route path="/update-status" element={<ProtectedRoute><UpdateStatus /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      
      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminPanel /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
