import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import LandingPage from '../components/LandingPage/LandingPage';
import LoginForm from '../components/LoginForm';
import UploadForm from '../components/UploadForm/UploadForm';
import { useAuthToken } from '../hooks/useAuthToken';

function AppRoutes() {
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { get: getToken } = useAuthToken(() => setLoggedInUser(null));
  const location = useLocation();

  useEffect(() => {
    const validate = () => {
      const savedUsername = localStorage.getItem('username');
      const token = getToken();

      if (savedUsername && token) {
        setLoggedInUser(savedUsername);
      } else {
        setLoggedInUser(null);
      }
      setLoading(false);
    };

    validate();
  }, [getToken, location?.pathname]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleLoginSuccess = (username: string, token: string) => {
    localStorage.setItem('username', username);
    localStorage.setItem('idToken', token);
    setLoggedInUser(username);
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          loggedInUser ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          loggedInUser ? (
            <LandingPage username={loggedInUser} setLoggedInUser={setLoggedInUser} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/old_ui"
        element={
          loggedInUser ? (
            <UploadForm onUploadComplete={setToastMessage} setLoggedInUser={setLoggedInUser} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to={loggedInUser ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default AppRoutes;
