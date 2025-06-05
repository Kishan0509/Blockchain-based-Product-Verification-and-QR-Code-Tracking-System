import { useEffect, useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import "../styles/AdminPanel.css";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const AdminPanel = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [message, setMessage] = useState('');
  const [showAddUserForm, setShowAddUserForm] = useState(false); 
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        });

        const data = await res.json();
        if (res.ok) setUsers(data);
        else console.error("Failed to fetch users:", data.message);
      } catch (err) {
        console.error("Error:", err);
      }
    };

    if (user?.role === "admin") fetchUsers();
  }, [user]);

  const handleApproval = async (userId, action) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/${action}/${userId}`, {
        method: "POST",
        headers: {
          "x-auth-token": localStorage.getItem("token"),
        },
      });

      const data = await res.json();
      if (res.ok) {
        setUsers(prev =>
          prev.map(u => (u._id === userId ? { ...u, status: data.user.status } : u))
        );
      } else {
        console.error(`❌ Failed to ${action} user:`, data.message);
      }
    } catch (err) {
      console.error(`❌ Error during ${action}:`, err);
    }
  };


  const handleBlock = async (userId) => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/block/${userId}`, {
            method: "POST",
            headers: {
                "x-auth-token": localStorage.getItem("token"),
            },
        });
        const data = await res.json();
        if (res.ok) {
            setUsers(prev =>
                prev.map(u => (u._id === userId ? { ...u, status: data.user.status } : u))
            );
        } else {
            console.error(`❌ Failed to block user:`, data.message);
        }
    } catch (err) {
        console.error(`❌ Error during blocking:`, err);
    }
  };

  
  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/delete/${userId}`, {
                method: "DELETE",
                headers: {
                    "x-auth-token": localStorage.getItem("token"),
                },
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(prev => prev.filter(u => u._id !== userId));
            } else {
                console.error(`❌ Failed to delete user:`, data.message);
            }
        } catch (err) {
            console.error(`❌ Error during deletion:`, err);
        }
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify(newAdmin),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ New admin added successfully!");
        setUsers(prev => [...prev, data.user]); 
        setNewAdmin({ name: '', email: '', password: '', role: 'admin' }); 
        setShowAddUserForm(false); 
      } else {
        setMessage(`❌ ${data.message || "Failed to add admin!"}`);
      }
    } catch (err) {
      console.error("Error adding admin:", err);
      setMessage("❌ An error occurred while adding the admin.");
    }
  };

  return (
    <div className='admin-panel'>
      <h2>👥 Admin Panel - All Users</h2>
      
      <button className="add-user-btn" onClick={() => setShowAddUserForm(!showAddUserForm)} > {showAddUserForm ? "Cancel" : "Add New User"} </button>

      {showAddUserForm && (
        <form onSubmit={handleAddAdmin} className="add-admin-form">
          <h3>Add New User</h3>
          <input type="text" placeholder="Name" value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} required />
          <input type="email" placeholder="Email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} required />
          <input type="password" placeholder="Password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} required />
          <select value={newAdmin.role} onChange={(e) => setNewAdmin({ ...newAdmin,role: e.target.value })} >
            <option value="admin">Admin</option>
            <option value="manufacturer">Manufacturer</option>
            <option value="supplier">Supplier</option>
            <option value="retailer">Retailer</option>
          </select>
          <button type="submit">Add User</button>
          {message && <p className={message.includes("✅") ? "success-message" : "error-message"}>{message}</p>}
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u._id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <span className={`status-badge ${u.status}`}>{u.status}</span>
              </td>
              <td>
                {u.status === "pending" ? (
                  <>
                    <button className="approve-btn" onClick={() => handleApproval(u._id, "approve")}> Approve </button>
                    <button className="reject-btn" onClick={() => handleApproval(u._id, "reject")}> Reject </button>
                  </>
                ) : (
                  <>
                    {u.status === "blocked" ? (
                      <>
                        <button className="approve-btn" onClick={() => handleApproval(u._id, "approve")}>Unblock</button>
                        <button className="delete-btn" onClick={() => handleDelete(u._id)}>Delete</button>
                      </>
                    ) : (
                      <>
                        <button className="block-btn" onClick={() => handleBlock(u._id)}>Block</button>
                        <button className="delete-btn" onClick={() => handleDelete(u._id)}>Delete</button>
                      </>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPanel;