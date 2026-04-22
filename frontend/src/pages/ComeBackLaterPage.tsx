import { Box, Container, Stack, Typography } from '@mui/material';

export function ComeBackLaterPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Typography variant="h3" component="h1">
            Заходите попозже
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Через несколько лет здесь будет много интересного.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            А пока — лимонад, мультики и долгие прогулки на свежем воздухе.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
