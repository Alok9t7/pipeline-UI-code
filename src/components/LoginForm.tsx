import { CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import IGN_Logo from '../assets/IGN_Logo.svg';
import { login } from '../utils/auth';
import './LoginForm.scss';
import ResetPassword from './ResetPassword/ResetPassword';

interface LoginFormProps {
  onLoginSuccess: (username: string, token: string) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [cognitoUser, setCognitoUser] = useState<CognitoUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg('');
    try {
      const session: CognitoUserSession = await login(username.trim(), password);
      const idToken = session.getIdToken().getJwtToken();
      localStorage.setItem('idToken', idToken);
      onLoginSuccess(username.trim(), idToken);
      setMsg(`✅ Logged in! Token: ${idToken.substring(0, 20)}...`);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.type === 'NEW_PASSWORD_REQUIRED' && err.cognitoUser) {
        setMsg('⚠️ New password required. Please enter a new password.');
        setCognitoUser(err.cognitoUser);
      } else {
        setMsg(`❌ Login failed: ${err.message || JSON.stringify(err)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (cognitoUser) {
    return (
      <ResetPassword
        username={username}
        setCognitoUser={setCognitoUser}
        onLoginSuccess={onLoginSuccess}
      />
    );
  }

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="left-content">
          {/* <h1>Welcome</h1>
          <p>
            Start your journey now with our AI
            <br /> labelling system!
          </p> */}
        </div>
      </div>

      <div className="login-right">
        <div className="top-logo">
          <img src={IGN_Logo} alt="Ignitarium logo" />
        </div>

        <div className="login-card">
          <h2>Login to your account</h2>

          <form onSubmit={handleLogin} className="login-form">
            <label>Email ID</label>
            <input
              type="email"
              placeholder="Enter your email ID"
              autoComplete="username"
              value={username}
              onChange={handleUsernameChange}
              disabled={isLoading}
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={handlePasswordChange}
              disabled={isLoading}
            />

            <button type="submit" disabled={isLoading} className={isLoading ? 'loading' : ''}>
              {isLoading ? (
                <>
                  <span className="loader"></span>
                  Signing in...
                </>
              ) : (
                'Login to Your Account'
              )}
            </button>
          </form>

          <div className="links">
            <a href="#">Forgot password?</a>
            <div className="create">
              Don't have an account? <a href="#">Create new account here</a>
            </div>
          </div>
        </div>

        {msg && <div className="message">{msg}</div>}
      </div>
    </div>
  );
}
