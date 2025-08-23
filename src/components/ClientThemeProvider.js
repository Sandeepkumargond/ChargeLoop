'use client';

import { ThemeProvider as BaseThemeProvider } from '../contexts/ThemeContext';

export default function ClientThemeProvider({ children }) {
  return <BaseThemeProvider>{children}</BaseThemeProvider>;
}
