export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('At least 8 characters required.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter required.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter required.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('At least one number required.');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('At least one special character required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
