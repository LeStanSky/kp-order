import { createTheme, type PaletteMode } from '@mui/material/styles';

export const createAppTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' },
    },
  });

// Legacy export for test utils
export const theme = createAppTheme('light');
