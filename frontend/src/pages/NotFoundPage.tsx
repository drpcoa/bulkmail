import { Box, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          textAlign: 'center',
          py: 8,
        }}
      >
        <ErrorOutlineIcon 
          sx={{ 
            fontSize: 80, 
            color: 'error.main',
            mb: 3
          }} 
        />
        
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          404 - Page Not Found
        </Typography>
        
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ 
            maxWidth: 600,
            mb: 4,
            lineHeight: 1.6
          }}
        >
          Oops! The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'medium',
              boxShadow: '0 4px 14px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Go to Homepage
          </Button>
          
          <Button
            variant="outlined"
            color="primary"
            size="large"
            onClick={() => window.history.back()}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'medium',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Go Back
          </Button>
        </Box>
        
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Need help? Contact our support team at{' '}
            <a 
              href="mailto:support@bulkmail.example.com"
              style={{ 
                color: '#1976d2',
                textDecoration: 'none',
              }}
              className="support-email"
            >
              support@bulkmail.example.com
            </a>
          </Typography>
        </Box>
      </Box>
      <Box
        component="style"
        dangerouslySetInnerHTML={{
          __html: `
            .support-email:hover {
              text-decoration: underline;
            }
          `,
        }}
      />
    </Container>
  );
};

export default NotFoundPage;
