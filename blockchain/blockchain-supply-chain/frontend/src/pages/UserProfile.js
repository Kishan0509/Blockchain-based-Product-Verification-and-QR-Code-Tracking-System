import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaEdit } from 'react-icons/fa';
import '../styles/UserProfile.css';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const UserProfile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState(user.name);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('✅ Password changed successfully!');
        setOldPassword('');
        setNewPassword('');
      } else {
        setMessage(`❌ ${data.message || 'Failed to change password!'}`);
      }
    } catch (error) {
      setMessage('❌ An error occurred. Please try again.');
      console.error('Error: ', error);
    }
  };

  const handleNameChange = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({ name: newName }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('✅ Name updated successfully!');
        user.name = newName; 
      } else {
        setMessage(`❌ ${data.message || 'Failed to update name!'}`);
      }
    } catch (error) {
      setMessage('❌ An error occurred. Please try again.');
      console.error('Error: ', error);
    }
  };

  if (!user) {
    return <h1 className="profile-message">Please log in to view your profile.</h1>;
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <h2>User Profile</h2>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>

        <div className="profile-info-grid">
          <div><strong>Name:</strong> {user.name}</div>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>ID:</strong> {user.id}</div>
          <div><strong>Role:</strong> {user.role}</div>
        </div>
      </div>

      <div className="profile-card">
        <div className="password-header">
          <h3>Edit Profile</h3>
          <FaEdit className="edit-icon" onClick={() => setIsEditing(!isEditing)} />
        </div>

        {isEditing && (
          <>
            <form onSubmit={handleNameChange} className="password-form">
              <input
                type="text"
                placeholder="New Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <button type="submit" className="save-btn">Update Name</button>
            </form>

            <form onSubmit={handlePasswordChange} className="password-form">
              <input
                type="password"
                placeholder="Old Password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button type="submit" className="save-btn">Change Password</button>
            </form>
          </>
        )}

        {message && (
          <p className={message.includes('✅') ? 'success-message' : 'error-message'}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
