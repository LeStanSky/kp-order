import { createTheme, type PaletteMode } from '@mui/material/styles';

// Corporate colors from brand passport
const BRAND_RED = '#E42127';
const BRAND_BLACK = '#1A1A1A';

export const createAppTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: BRAND_RED, contrastText: '#fff' },
      secondary: { main: BRAND_BLACK, contrastText: '#fff' },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: BRAND_BLACK,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          contained: {
            '&:hover': {
              backgroundColor: '#c71d23',
            },
          },
        },
      },
    },
  });

// Legacy export for test utils
export const theme = createAppTheme('light');
