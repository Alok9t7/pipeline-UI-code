import React, { useState } from 'react';

import IGN_Logo from '../../assets/IGN_Logo.svg';
import help from '../../assets/help.svg';
import notification_icon from '../../assets/notification_icon.svg';
import settings from '../../assets/settings.svg';
import user from '../../assets/user.svg';
import './Header.scss';

interface HeaderProps {
  onLogout: () => void;
}
function Header({ onLogout }: HeaderProps) {
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    // Add logout logic here
  };

  return (
    <header className="top-nav flex items-center justify-between px-4 py-2 shadow bg-white">
      <div className="flex items-center space-x-2">
        <img src={IGN_Logo} alt="Ignitarium logo" className="h-6" />
      </div>

      <div className="project-dropdown">
        <div
          className="project-dropdown-trigger"
          onClick={() => setIsProjectDropdownOpen((prev) => !prev)}
        >
          <span className="project-name">Project Name XYZ</span>
          <span className="arrow">⌄</span>
        </div>

        {isProjectDropdownOpen && (
          <div className="project-dropdown-menu">
            <div className="dropdown-item">Project A</div>
            <div className="dropdown-item">Project B</div>
          </div>
        )}
      </div>

      <div className="right-section">
        <div title="Notifications" className="icon">
          <img src={notification_icon} alt="notification" />
        </div>
        <div title="Settings" className="icon">
          <img src={settings} alt="settings" />
        </div>
        <div title="Help" className="icon">
          <img src={help} alt="help" />
        </div>

        <div className="user-dropdown">
          <div
            onClick={() => setIsUserDropdownOpen((prev) => !prev)}
            className="user-dropdown-trigger"
          >
            <img src={user} alt="user" style={{ marginRight: '20px' }} />

            <span className="arrow">⌄</span>
          </div>

          {isUserDropdownOpen && (
            <div className="user-dropdown-menu">
              <div className="dropdown-item" onClick={handleLogout}>
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
