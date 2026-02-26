import { Typography, Container } from '@mui/material';

export default function HomePage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        KPOrder
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Web application for ERP stock management
      </Typography>
    </Container>
  );
}
