import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
} from '@mui/material';
import { useConsentStore } from '@/store/consentStore';

const EXEMPT_PATHS = ['/come-back-later', '/privacy-policy'];

interface AgeVerificationGateProps {
  children: ReactNode;
}

export function AgeVerificationGate({ children }: AgeVerificationGateProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isConfirmed = useConsentStore((s) => s.isAgeConfirmed());
  const confirmAge = useConsentStore((s) => s.confirmAge);

  const isExempt = EXEMPT_PATHS.includes(location.pathname);

  if (isExempt || isConfirmed) return <>{children}</>;

  return (
    <>
      {children}
      <Dialog
        open
        disableEscapeKeyDown
        aria-labelledby="age-verification-title"
        aria-label="Подтверждение возраста"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle id="age-verification-title">Подтверждение возраста</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            <Typography variant="body1">
              На этом сайте представлена информация об алкогольной продукции.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Подтвердите, что вам исполнилось 18 лет.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: 'wrap' }}>
          <Button
            onClick={() => navigate('/come-back-later', { replace: true })}
            color="inherit"
            variant="outlined"
          >
            Мне нет 18
          </Button>
          <Button onClick={confirmAge} variant="contained" autoFocus>
            Мне есть 18
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
