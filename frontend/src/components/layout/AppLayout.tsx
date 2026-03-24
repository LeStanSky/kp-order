import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { Header } from './Header';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 3 } }}>
        {children}
      </Box>
    </Box>
  );
}
