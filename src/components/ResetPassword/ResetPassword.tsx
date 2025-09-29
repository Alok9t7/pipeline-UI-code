import { AlertColor } from '@mui/material';
import { CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js';
import React, { FormEvent, useEffect, useState } from 'react';

import IGN_Logo from '../../assets/IGN_Logo.svg';
import titlecard from '../../assets/titlecard.svg';
import { login } from '../../utils/auth';
import { validatePassword } from '../../utils/passwordValidation';
import Toast from '../Toast/Toast';
import './ResetPassword.scss';

interface ResetPasswordProps {
  username: string;
  setCognitoUser: React.Dispatch<React.SetStateAction<CognitoUser | null>>;
  onLoginSuccess: (username: string, token: string) => void;
}

interface Errors {
  temp?: string;
  new?: string;
}

export default function ResetPasswordPage({
  username,
  setCognitoUser,
  onLoginSuccess,
}: ResetPasswordProps) {
  const [tempPassword, setTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<AlertColor>('success');
  const [isPasswordChanged, setIsPasswordChanged] = useState(false);

  const handleToastClose = () => {
    setToastOpen(false);
  };

  const handleTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempPassword(value);

    setErrors((prev) => ({
      ...prev,
      temp: value.trim() ? '' : 'Temporary password is required.',
    }));
  };

  useEffect(() => {
    const tempValid = tempPassword.trim().length > 0;
    const newValid = validatePassword(newPassword).isValid;

    setIsFormValid(tempValid && newValid);
  }, [tempPassword, newPassword]);

  const handleNewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);

    const { errors } = validatePassword(value);

    setErrors((prev) => ({ ...prev, new: errors[0] || '' }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) {
      setToastMessage('Please fix validation errors before submitting.');
      setToastSeverity('error');
      setToastOpen(true);
      return;
    }
    await handleNewPassword(e);
  };

  const handleNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const session: CognitoUserSession = await login(username.trim(), tempPassword, newPassword);
      const idToken = session.getIdToken().getJwtToken();
      localStorage.setItem('idToken', idToken);
      onLoginSuccess(username.trim(), idToken);
      setToastMessage(`Password changed and logged in! Token: ${idToken.substring(0, 20)}...`);
      setToastSeverity('success');
      setToastOpen(true);
      setCognitoUser(null);
      setIsPasswordChanged(true);
    } catch (err: any) {
      setToastMessage(`Failed to set new password: ${err.message || JSON.stringify(err)}`);
      setToastSeverity('error');
      setToastOpen(true);
    }
  };

  return (
    <div className="container">
      <div className="left">
        <img src={titlecard} alt="AI chip" className="left-image" />
      </div>
      <div className="right">
        <img src={IGN_Logo} alt="Logo" className="card-image" />
        <div className={`card ${isPasswordChanged ? 'success-card' : ''}`}>
          {!isPasswordChanged ? (
            <div className="inner-layout">
              <h2 className="card-title">Reset Password</h2>
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <label className="input-label">
                    Temporary Password<span className="required-star">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    className="input-password"
                    value={tempPassword}
                    onChange={handleTempChange}
                  />
                  {errors.temp && <p className="error-text">{errors.temp}</p>}
                </div>

                <div className="input-group">
                  <label className="input-label">
                    New password<span className="required-star">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    className="input-password"
                    value={newPassword}
                    onChange={handleNewChange}
                  />
                  {errors.new && <p className="error-text">{errors.new}</p>}
                </div>

                <button type="submit" className="submit-btn" disabled={!isFormValid}>
                  Reset Password
                </button>
              </form>
            </div>
          ) : (
            <>
              <h2 className="card-title-new">Reset password</h2>
              <p>Password changed successfully.</p>
              <a href="/" className="login-link">
                Back to Login Page.
              </a>
            </>
          )}

          <Toast
            open={toastOpen}
            onClose={handleToastClose}
            message={toastMessage}
            severity={toastSeverity}
          />
        </div>
      </div>
    </div>
  );
}
