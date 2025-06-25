import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid,
  Box,
  Paper,
  useTheme
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import FaceIcon from '@mui/icons-material/Face';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SecurityIcon from '@mui/icons-material/Security';

const Home = () => {
  const theme = useTheme();
  return (
    <Container maxWidth="lg">
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Identity Verification System
        </Typography>
        <Typography variant="h5" color="textSecondary" paragraph>
          Secure, Fast, and Reliable Identity Verification
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          component={RouterLink} 
          to="/verify"
          startIcon={<VerifiedUserIcon />}
          sx={{ mt: 2 }}
        >
          Start Verification
        </Button>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <AssignmentIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  Document Verification
                </Typography>
              </Box>
              <Typography variant="body1">
                Upload your identity document (Aadhar card) for verification. 
                Our system uses advanced OCR technology to extract and verify 
                the information from your document.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <FaceIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  Face Matching
                </Typography>
              </Box>
              <Typography variant="body1">
                Take a selfie to verify your identity. Our system uses facial 
                recognition technology to compare your selfie with the photo 
                on your identity document.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <SecurityIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  Age Verification
                </Typography>
              </Box>
              <Typography variant="body1">
                Our system automatically extracts your date of birth from your 
                identity document and verifies if you meet the age criteria 
                (e.g., 18+ years old).
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={3} sx={{ 
        mt: 6, 
        p: 3, 
        backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8f9fa',
        color: 'text.primary'
      }}>
        <Typography variant="h5" gutterBottom>
          How It Works
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" component="span" sx={{ 
                width: 30, 
                height: 30, 
                borderRadius: '50%', 
                backgroundColor: 'primary.main', 
                color: 'white', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                mr: 2
              }}>
                1
              </Typography>
              <Typography variant="body1">
                Upload your identity document (Aadhar card)
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" component="span" sx={{ 
                width: 30, 
                height: 30, 
                borderRadius: '50%', 
                backgroundColor: 'primary.main', 
                color: 'white', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                mr: 2
              }}>
                2
              </Typography>
              <Typography variant="body1">
                Take a selfie using your camera
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" component="span" sx={{ 
                width: 30, 
                height: 30, 
                borderRadius: '50%', 
                backgroundColor: 'primary.main', 
                color: 'white', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                mr: 2
              }}>
                3
              </Typography>
              <Typography variant="body1">
                Get instant verification results
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Home; 