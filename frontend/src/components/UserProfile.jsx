import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './UserProfile.css';

const UserProfile = () => {
  const { user, logout, updatePreferences } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState(user?.preferences || {});

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    try {
      await updatePreferences({ [key]: value });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      // Revert on error
      setPreferences(user.preferences);
    }
  };

  if (!user) return null;

  return (
    <div className="user-profile">
      <button 
        className="profile-button"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <img 
          src={user.picture || '/default-avatar.png'} 
          alt={user.name}
          className="profile-image"
        />
        <span className="profile-name">{user.name}</span>
        <svg className="dropdown-icon" viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M7 10l5 5 5-5z"/>
        </svg>
      </button>

      {showDropdown && (
        <div className="profile-dropdown">
          <div className="profile-info">
            <img src={user.picture || '/default-avatar.png'} alt={user.name} />
            <div>
              <div className="profile-info-name">{user.name}</div>
              <div className="profile-info-email">{user.email}</div>
            </div>
          </div>

          <div className="dropdown-divider" />

          <button 
            className="dropdown-item"
            onClick={() => {
              setShowPreferences(true);
              setShowDropdown(false);
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
            </svg>
            Preferences
          </button>

          <button className="dropdown-item" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"/>
            </svg>
            Sign Out
          </button>
        </div>
      )}

      {showPreferences && (
        <div className="preferences-modal">
          <div className="preferences-content">
            <div className="preferences-header">
              <h3>Preferences</h3>
              <button 
                className="close-button"
                onClick={() => setShowPreferences(false)}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
              </button>
            </div>

            <div className="preferences-form">
              <div className="form-group">
                <label>Theme</label>
                <select 
                  value={preferences.theme || 'dark'}
                  onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              <div className="form-group">
                <label>Font Size</label>
                <input 
                  type="range"
                  min="10"
                  max="24"
                  value={preferences.fontSize || 14}
                  onChange={(e) => handlePreferenceChange('fontSize', parseInt(e.target.value))}
                />
                <span>{preferences.fontSize || 14}px</span>
              </div>

              <div className="form-group">
                <label>Default Language</label>
                <select 
                  value={preferences.defaultLanguage || 'javascript'}
                  onChange={(e) => handlePreferenceChange('defaultLanguage', e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="typescript">TypeScript</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;