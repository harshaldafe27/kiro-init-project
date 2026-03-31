import { createContext, useContext, useEffect } from 'react';
import useStore from '../store/useStore';
import { getMeApi } from '../api/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const setAuth = useStore((s) => s.setAuth);
  const accessToken = useStore((s) => s.accessToken);

  useEffect(() => {
    if (accessToken) {
      window.__accessToken__ = accessToken;
    }
  }, [accessToken]);

  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => useContext(AuthContext);
