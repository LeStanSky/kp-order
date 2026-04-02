import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { Header } from './Header';
import { Footer } from './Footer';

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
      <Footer />
    </Box>
  );
}
