import { Box, Button, Paper, Stack, Typography, Link as MuiLink } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useConsentStore } from '@/store/consentStore';

export function PrivacyConsentBanner() {
  const accepted = useConsentStore((s) => s.privacyAccepted);
  const acceptPrivacy = useConsentStore((s) => s.acceptPrivacy);

  if (accepted) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (t) => t.zIndex.snackbar,
        p: { xs: 1, sm: 2 },
        pointerEvents: 'none',
      }}
    >
      <Paper
        elevation={6}
        sx={{
          maxWidth: 960,
          mx: 'auto',
          p: 2,
          pointerEvents: 'auto',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
        >
          <Typography variant="body2">
            Мы храним токены авторизации и настройки в вашем браузере (localStorage). Продолжая
            использовать сайт, вы соглашаетесь с обработкой персональных данных в соответствии с{' '}
            <MuiLink component={RouterLink} to="/privacy-policy">
              Политикой обработки персональных данных
            </MuiLink>
            .
          </Typography>
          <Button onClick={acceptPrivacy} variant="contained" sx={{ flexShrink: 0 }}>
            Согласен
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
