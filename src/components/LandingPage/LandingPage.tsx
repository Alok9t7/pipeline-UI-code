import React, { useEffect, useRef, useState } from 'react';

import IGN_Logo from '../../assets/IGN_Logo.svg';
import Header from '../HeaderComponent/Header';
import SteppProgressComponent from '../StepProgressComponent/StepProgressComponent';
import './LandingPage.scss';

interface LandingPageProps {
  username: string;
  setLoggedInUser: (v: string | null) => void;
}

const HEADER_HEIGHT_PX = 72; // tweak if your header is taller/shorter

const LandingPage: React.FC<LandingPageProps> = ({ username, setLoggedInUser }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const ddRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('idToken');
    localStorage.removeItem('username');
    setLoggedInUser(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ddRef.current) return;
      if (!ddRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
    };
    if (isDropdownOpen) document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [isDropdownOpen]);

  return (
    <div
      className="layout"
      style={
        {
          // Expose header height to CSS
          ['--header-h' as any]: `${HEADER_HEIGHT_PX}px`,
        } as React.CSSProperties
      }
    >
      <Header onLogout={handleLogout} />
      <main className="main-content">
        <SteppProgressComponent setLoggedInUser={setLoggedInUser} />
      </main>
    </div>
  );
};

export default LandingPage;
