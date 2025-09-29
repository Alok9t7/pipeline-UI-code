// hooks/useAuthToken.ts
import { useCallback, useEffect, useRef } from 'react';

import { isTokenExpired } from '../utils/jwt';

export function useAuthToken(onExpire?: () => void) {
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const get = useCallback(() => {
    const token = localStorage.getItem('idToken');
    if (!token || isTokenExpired(token)) {
      onExpireRef.current?.();
      return null;
    }
    return token;
  }, []);

  return { get };
}
