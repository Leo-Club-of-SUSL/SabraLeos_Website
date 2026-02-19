import { createContext, useContext, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as Theme) || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = async () => {
    // Check if the browser supports View Transitions
    if (!document.startViewTransition) {
      setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
      return;
    }

    try {
      // Use View Transition API
      await document.startViewTransition(() => {
        flushSync(() => {
          setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
        });
      }).ready;
    } catch (error) {
      // Fallback if something goes wrong
      setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
