import { Box, Typography } from '@mui/material';

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        textAlign: 'center',
        bgcolor: 'secondary.main',
        color: 'secondary.contrastText',
      }}
    >
      <Typography variant="body2">&copy; {new Date().getFullYear()} LeStanSky</Typography>
    </Box>
  );
}
