import { useEffect, useState } from 'react';
import { HashRouter } from 'react-router-dom';

import './App.scss';
import LandingPage from './components/LandingPage/LandingPage';
import LoginForm from './components/LoginForm';
import AppRoutes from './routes/AppRoutes';

function App() {
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);

  useEffect(() => {
    // On initial load, check if user info is saved
    const savedUsername = localStorage.getItem('username');
    const idToken = localStorage.getItem('idToken');

    if (savedUsername && idToken) {
      setLoggedInUser(savedUsername);
    }
  }, []);

  const handleLoginSuccess = (username: string) => {
    localStorage.setItem('username', username);
    setLoggedInUser(username);
  };

  return (
    <div className="login-container">
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </div>
  );
}

export default App;
