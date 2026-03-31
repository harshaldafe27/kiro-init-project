import { createContext, useContext, useEffect } from 'react';
import useStore from '../store/useStore';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const isDark = useStore((s) => s.isDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return <ThemeContext.Provider value={{ isDark }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
