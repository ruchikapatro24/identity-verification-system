import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Box,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import FaceIcon from '@mui/icons-material/Face';
import WarningIcon from '@mui/icons-material/Warning';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

// Clean up duplicate import issue
const VerificationResult = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get result from session storage
    const storedResult = sessionStorage.getItem('verificationResult');
    
    if (storedResult) {
      try {
        setResult(JSON.parse(storedResult));
      } catch (err) {
        console.error('Error parsing result:', err);
        setError('Error loading verification result');
      }
    } else {
      setError('No verification result found. Please complete the verification process.');
    }
    
    setLoading(false);
  }, []);

  const handleNewVerification = () => {
    // Clear the stored result
    sessionStorage.removeItem('verificationResult');
    navigate('/verify');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading verification result...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button 
              variant="contained" 
              onClick={handleNewVerification}
              sx={{ mr: 2 }}
            >
              Start New Verification
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleGoHome}
            >
              Go Home
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  const { documentInfo, verification, photoQuality } = result;
  const overallVerified = verification.faceMatch && verification.isAdult;
  const faceMatchConfidence = Math.round(verification.faceMatchConfidence * 100);

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            {overallVerified ? (
              <CheckCircleIcon color="success" sx={{ fontSize: 60 }} />
            ) : (
              <CancelIcon color="error" sx={{ fontSize: 60 }} />
            )}
          </Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Verification {overallVerified ? 'Successful' : 'Failed'}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {overallVerified 
              ? 'Your identity has been successfully verified.' 
              : 'We could not verify your identity. Please check the details below.'}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1 }} /> 
                  Document Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Name" 
                      secondary={documentInfo.name || 'Not detected'} 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <EventIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Date of Birth" 
                      secondary={documentInfo.dob || 'Not detected'} 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <CreditCardIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Document Number" 
                      secondary={documentInfo.documentNumber || 'Not detected'} 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <EventIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Age" 
                      secondary={documentInfo.age ? `${documentInfo.age} years` : 'Not detected'} 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <VerifiedUserIcon sx={{ mr: 1 }} /> 
                  Verification Results
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      {verification.faceMatch ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <CancelIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary="Face Match" 
                      secondary={
                        verification.faceMatch 
                          ? `Match confirmed (${faceMatchConfidence}% confidence)` 
                          : `No match (${faceMatchConfidence}% confidence)`
                      } 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      {verification.isAdult ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <WarningIcon color="warning" />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary="Age Verification" 
                      secondary={
                        verification.isAdult 
                          ? `Age verified (18+ years)` 
                          : `Age requirement not met (under 18)`
                      } 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      {overallVerified ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <CancelIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary="Overall Verification" 
                      secondary={
                        overallVerified 
                          ? `Identity verified successfully` 
                          : `Identity verification failed`
                      } 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Photo Quality Information */}
        {photoQuality && (
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PhotoCameraIcon sx={{ mr: 1 }} /> 
                    Photo Quality Analysis
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" color={
                          photoQuality.status === 'good' ? 'success.main' :
                          photoQuality.status === 'fair' ? 'warning.main' : 'error.main'
                        }>
                          {photoQuality.score}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Quality Score
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h6" color={
                          photoQuality.status === 'good' ? 'success.main' :
                          photoQuality.status === 'fair' ? 'warning.main' : 'error.main'
                        }>
                          {photoQuality.status.toUpperCase()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Overall Status
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h6">
                          {photoQuality.fileSizeKB} KB
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          File Size
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h6">
                          {photoQuality.issues?.length || 0}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Issues Found
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {photoQuality.issues && photoQuality.issues.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Issues Detected:
                      </Typography>
                      <List dense>
                        {photoQuality.issues.map((issue, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <WarningIcon color="warning" />
                            </ListItemIcon>
                            <ListItemText primary={issue} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  
                  {photoQuality.recommendations && photoQuality.recommendations.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Recommendations for better photos:
                      </Typography>
                      <List dense>
                        {photoQuality.recommendations.map((recommendation, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <PhotoCameraIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary={recommendation} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button 
            variant="contained" 
            onClick={handleNewVerification}
            sx={{ mr: 2 }}
          >
            Start New Verification
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleGoHome}
          >
            Go Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default VerificationResult; 