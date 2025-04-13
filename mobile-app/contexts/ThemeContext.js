import React, { createContext, useContext } from 'react';

// Grab color palette
const theme = {
  colors: {
    primary: '#00B14F',     // Grab Green
    secondary: '#00833B',   // Darker Green
    tertiary: '#29B473',    // Lighter Green
    background: '#FFFFFF',  // White
    surface: '#F7F7F7',     // Light Grey
    error: '#E74C3C',       // Red
    text: '#1C1C1C',        // Near Black
    textLight: '#6E6E6E',   // Grey
    textInverted: '#FFFFFF', // White
    border: '#E0E0E0',      // Light Grey
    success: '#00B14F',     // Grab Green
    warning: '#F39C12',     // Orange
    info: '#3498DB',        // Blue
    disabled: '#BDBDBD',    // Grey
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  rounded: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 30,
    },
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
};

const ThemeContext = createContext(theme);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export default theme;