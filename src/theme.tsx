import React, { createContext, useContext, useEffect } from 'react';

export type SkilloraTheme = 'light';

interface ThemeContextValue {
  theme: SkilloraTheme;
  setTheme: (next: SkilloraTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    try {
      window.localStorage.removeItem('skillora_theme_v2');
    } catch {
      // ignore storage errors
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: 'light',
        setTheme: () => {},
        toggleTheme: () => {},
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export interface ChartPalette {
  grid: string;
  axisText: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  accentTeal: string;
  accentTealFill: string;
  amber: string;
  amberFill: string;
  mutedLine: string;
  mutedFill: string;
}

export function getChartPalette(_theme?: SkilloraTheme): ChartPalette {
  return {
    grid: '#E2E8F0',
    axisText: '#64748B',
    tooltipBg: '#FFFFFF',
    tooltipBorder: '#E2E8F0',
    tooltipText: '#172B4D',
    accentTeal: '#2563EB',
    accentTealFill: 'rgba(37, 99, 235, 0.22)',
    amber: '#1D4ED8',
    amberFill: 'rgba(29, 78, 216, 0.12)',
    mutedLine: '#64748B',
    mutedFill: 'rgba(100, 116, 139, 0.14)',
  };
}
