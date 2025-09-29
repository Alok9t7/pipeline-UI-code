import CloseIcon from '@mui/icons-material/Close';
import { Alert, AlertColor, IconButton, Snackbar } from '@mui/material';
import React from 'react';

interface ToastProps {
  open: boolean;
  onClose: () => void;
  message: string;
  severity?: AlertColor; // 'success' | 'info' | 'warning' | 'error'
}

const Toast: React.FC<ToastProps> = ({ open, onClose, message, severity = 'success' }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        severity={severity}
        sx={{ width: '100%', alignItems: 'center' }}
        action={
          <IconButton aria-label="close" color="inherit" size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Toast;
