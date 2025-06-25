import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const API_URL = 'http://localhost:5000/api';

const VerificationForm = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [document, setDocument] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [photoQuality, setPhotoQuality] = useState(null);
  const [qualityWarning, setQualityWarning] = useState('');
  const [liveQuality, setLiveQuality] = useState(null);
  const [qualityCheckInterval, setQualityCheckInterval] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const steps = ['Upload Document', 'Take Selfie', 'Verify Identity'];

  // Analyze photo quality
  const analyzePhotoQuality = (imageElement) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = imageElement.width || imageElement.naturalWidth;
      canvas.height = imageElement.height || imageElement.naturalHeight;
      
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let totalBrightness = 0;
      let totalVariance = 0;
      let pixelCount = 0;
      
      // Calculate brightness and variance (blur detection)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate brightness (luminance)
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        totalBrightness += brightness;
        pixelCount++;
      }
      
      const avgBrightness = totalBrightness / pixelCount;
      
      // Simple blur detection using edge detection approximation
      const blurScore = calculateBlurScore(data, canvas.width, canvas.height);
      
      const quality = {
        brightness: avgBrightness,
        isTooDark: avgBrightness < 60,
        isTooLight: avgBrightness > 200,
        isBlurry: blurScore < 100, // Lower score means more blur
        blurScore: blurScore,
        overallScore: calculateOverallScore(avgBrightness, blurScore)
      };
      
      resolve(quality);
    });
  };

  // Calculate blur score using Laplacian variance
  const calculateBlurScore = (data, width, height) => {
    const grayscale = [];
    
    // Convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      grayscale.push(gray);
    }
    
    let variance = 0;
    let count = 0;
    
    // Apply Laplacian filter
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const laplacian = 
          -grayscale[idx - width - 1] - grayscale[idx - width] - grayscale[idx - width + 1] -
          grayscale[idx - 1] + 8 * grayscale[idx] - grayscale[idx + 1] -
          grayscale[idx + width - 1] - grayscale[idx + width] - grayscale[idx + width + 1];
        
        variance += laplacian * laplacian;
        count++;
      }
    }
    
    return variance / count;
  };

  // Calculate overall quality score
  const calculateOverallScore = (brightness, blurScore) => {
    let score = 100;
    
    // Penalize for poor lighting
    if (brightness < 60) score -= 30; // Too dark
    else if (brightness > 200) score -= 20; // Too bright
    else if (brightness < 80 || brightness > 180) score -= 10; // Suboptimal lighting
    
    // Penalize for blur
    if (blurScore < 50) score -= 40; // Very blurry
    else if (blurScore < 100) score -= 20; // Somewhat blurry
    else if (blurScore < 200) score -= 10; // Slightly blurry
    
    return Math.max(0, score);
  };

  // Generate quality feedback message
  const generateQualityFeedback = (quality) => {
    const issues = [];
    const suggestions = [];
    
    if (quality.isTooDark) {
      issues.push('Image is too dark');
      suggestions.push('Move to a brighter location or turn on more lights');
    } else if (quality.isTooLight) {
      issues.push('Image is overexposed');
      suggestions.push('Reduce lighting or move away from bright light sources');
    } else if (quality.brightness < 80) {
      issues.push('Lighting could be better');
      suggestions.push('Try to find better lighting for clearer image');
    }
    
    if (quality.isBlurry) {
      if (quality.blurScore < 50) {
        issues.push('Image is very blurry');
        suggestions.push('Hold the camera steady and ensure proper focus');
      } else {
        issues.push('Image appears blurry');
        suggestions.push('Try to keep the camera still while taking the photo');
      }
    }
    
    if (issues.length === 0) {
      return { type: 'success', message: 'Good photo quality!' };
    } else {
      const message = `Photo quality issues detected: ${issues.join(', ')}. ${suggestions.join('. ')}.`;
      return { 
        type: quality.overallScore < 50 ? 'error' : 'warning', 
        message,
        score: quality.overallScore
      };
    }
  };

  // Handle document upload
  const handleDocumentChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      console.log('File selected:', file.name, file.type, file.size);
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        setError('File size too large. Please upload a file smaller than 10MB.');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please upload JPG, PNG, GIF, WebP, or PDF files only.');
        return;
      }
      
      // Clean up previous preview URL if it exists
      if (documentPreview && documentPreview !== 'PDF_FILE' && documentPreview !== 'OTHER_FILE') {
        URL.revokeObjectURL(documentPreview);
      }
      
      setDocument(file);
      
      // Handle different file types for preview
      if (file.type.startsWith('image/')) {
        // For image files, create object URL for preview
        const previewUrl = URL.createObjectURL(file);
        console.log('Created preview URL:', previewUrl);
        setDocumentPreview(previewUrl);
      } else if (file.type === 'application/pdf') {
        // For PDF files, we'll show file info instead of preview
        setDocumentPreview('PDF_FILE');
      } else {
        // For other files, show basic file info
        setDocumentPreview('OTHER_FILE');
      }
      
      setError('');
    }
  };

  // Handle drag and drop for document upload
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      // Create synthetic event to reuse handleDocumentChange logic
      const syntheticEvent = {
        target: { files: [files[0]] }
      };
      handleDocumentChange(syntheticEvent);
    }
  };

  // Start camera
  const startCamera = async () => {
    setCameraLoading(true);
    try {
      setError(''); // Clear any previous errors
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }

      // The video element should now always be available since it's always rendered
      if (!videoRef.current) {
        throw new Error('Video element not found. Please refresh the page and try again.');
      }
      
      await initializeCamera();
      setCameraActive(true);
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraActive(false);
      let errorMessage = 'Camera initialization failed. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Camera permission denied. Please allow camera access and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found. Please connect a camera and try again.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Camera constraints could not be satisfied.';
      } else {
        errorMessage += err.message || 'Please ensure camera permissions are granted and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setCameraLoading(false);
    }
  };
  
  // Separate function to initialize camera
  const initializeCamera = async () => {
    // Request camera access with fallback constraints
    const constraints = {
      video: {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        facingMode: "user"
      },
      audio: false
    };
    
    console.log("Requesting camera access with constraints:", constraints);
    
    try {
      // First check if video element is ready
      if (!videoRef.current) {
        throw new Error("Video element not available");
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log("Camera stream obtained successfully");
      
      // Set up video element
      const video = videoRef.current;
      video.srcObject = stream;
      
      // Create promise to wait for video to load
      const videoLoadPromise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Video failed to load within timeout'));
        }, 10000); // 10 second timeout
        
        video.onloadedmetadata = () => {
          clearTimeout(timeoutId);
          console.log("Video metadata loaded successfully");
          resolve();
        };
        
        video.onerror = (e) => {
          clearTimeout(timeoutId);
          console.error("Video element error:", e);
          reject(new Error('Video element failed to load'));
        };
      });
      
      // Wait for video to load, then play
      await videoLoadPromise;
      
      try {
        await video.play();
        console.log("Video playback started successfully");
      } catch (playError) {
        console.warn("Video autoplay failed, but stream is available:", playError);
        // Some browsers block autoplay, but the stream is still available for capture
      }
      
      streamRef.current = stream;
      console.log("Camera initialized successfully");
      
      // Start live quality monitoring
      startLiveQualityMonitoring();
      
    } catch (err) {
      console.error("Camera initialization error:", err);
      throw err;
    }
  };

  // Start live quality monitoring
  const startLiveQualityMonitoring = () => {
    if (qualityCheckInterval) {
      clearInterval(qualityCheckInterval);
    }
    
    const interval = setInterval(async () => {
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        try {
          // Create a temporary canvas for quality analysis
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          
          tempCanvas.width = videoRef.current.videoWidth;
          tempCanvas.height = videoRef.current.videoHeight;
          
          tempCtx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
          
          const quality = await analyzePhotoQuality(tempCanvas);
          setLiveQuality(quality);
          
        } catch (err) {
          console.warn('Live quality check failed:', err);
        }
      }
    }, 2000); // Check every 2 seconds
    
    setQualityCheckInterval(interval);
  };

  // Stop live quality monitoring
  const stopLiveQualityMonitoring = () => {
    if (qualityCheckInterval) {
      clearInterval(qualityCheckInterval);
      setQualityCheckInterval(null);
    }
    setLiveQuality(null);
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setCameraActive(false);
    }
    stopLiveQualityMonitoring();
  };

  // Capture selfie
  const captureSelfie = async () => {
    if (!videoRef.current || !videoRef.current.videoWidth) {
      setError('Video not ready. Please wait for the camera to fully load.');
      return;
    }

    // Create canvas if it doesn't exist
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    console.log(`Capturing selfie at ${canvas.width}x${canvas.height}`);
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Analyze photo quality
    try {
      const quality = await analyzePhotoQuality(canvas);
      const feedback = generateQualityFeedback(quality);
      
      setPhotoQuality(quality);
      
      if (feedback.type === 'error') {
        setQualityWarning(feedback.message);
        setError(`Photo quality too poor: ${feedback.message}`);
        return; // Don't capture if quality is too poor
      } else if (feedback.type === 'warning') {
        setQualityWarning(feedback.message);
      } else {
        setQualityWarning('');
      }
      
      console.log('Photo quality analysis:', quality);
      console.log('Quality feedback:', feedback);
    } catch (err) {
      console.warn('Quality analysis failed:', err);
      setQualityWarning('');
    }
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
        setSelfie(file);
        setSelfiePreview(URL.createObjectURL(blob));
        stopCamera();
        console.log('Selfie captured successfully');
      } else {
        setError('Failed to capture selfie. Please try again.');
      }
    }, 'image/jpeg', 0.95);
  };

  // Handle next step
  const handleNext = () => {
    if (activeStep === 0 && !document) {
      setError('Please upload an identity document');
      return;
    }
    
    if (activeStep === 1 && !selfie) {
      setError('Please take or upload a selfie');
      return;
    }
    
    if (activeStep === 2) {
      handleSubmit();
      return;
    }
    
    setActiveStep((prevStep) => prevStep + 1);
    setError('');
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  // Submit form
  const handleSubmit = async () => {
    if (!document || !selfie) {
      setError('Please upload both document and selfie');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('document', document);
    formData.append('selfie', selfie);

    try {
      const response = await axios.post(`${API_URL}/verify`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Store verification result in session storage
      sessionStorage.setItem('verificationResult', JSON.stringify(response.data));
      
      // Navigate to result page
      navigate('/result');
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check for camera permissions on component mount
  useEffect(() => {
    // Check if browser supports getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      console.log("Browser supports getUserMedia");
      
      // Check if camera permissions are already granted
      navigator.permissions.query({ name: 'camera' })
        .then(permissionStatus => {
          console.log("Camera permission status:", permissionStatus.state);
          
          // Log permission changes
          permissionStatus.onchange = () => {
            console.log("Camera permission changed to:", permissionStatus.state);
          };
        })
        .catch(err => {
          console.log("Permission query error:", err);
        });
    } else {
      console.error("Browser doesn't support getUserMedia");
      setError("Your browser doesn't support camera access. Please try a different browser.");
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (documentPreview && documentPreview !== 'PDF_FILE' && documentPreview !== 'OTHER_FILE') {
        URL.revokeObjectURL(documentPreview);
      }
      if (selfiePreview) {
        URL.revokeObjectURL(selfiePreview);
      }
      stopCamera();
      stopLiveQualityMonitoring();
    };
  }, [documentPreview, selfiePreview]);

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Identity Verification
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Upload Identity Document
              </Typography>
              <Typography variant="body1" paragraph>
                Please upload your Aadhar card or other identity document.
                We support JPG, PNG, GIF, WebP, and PDF formats (max 10MB).
              </Typography>

              <Box 
                sx={{ 
                  border: dragOver ? '2px dashed #1976d2' : '2px dashed #ccc',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  mb: 3,
                  cursor: 'pointer',
                  backgroundColor: dragOver ? '#f3f9ff' : 'transparent',
                  '&:hover': { 
                    borderColor: 'primary.main',
                    backgroundColor: '#f9f9f9'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <label htmlFor="document-upload" style={{ cursor: 'pointer', display: 'block', width: '100%', height: '100%' }}>
                  <input
                    id="document-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                    onChange={handleDocumentChange}
                    style={{ display: 'none' }}
                  />
                  <CloudUploadIcon sx={{ 
                    fontSize: 48, 
                    color: dragOver ? 'primary.main' : 'primary.main', 
                    mb: 1 
                  }} />
                  <Typography variant="body1" sx={{ fontWeight: dragOver ? 600 : 400 }}>
                    {dragOver ? 'Drop your document here' : 'Click to upload or drag and drop'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    JPG, PNG, GIF, WebP, or PDF (max 10MB)
                  </Typography>
                </label>
              </Box>

              {documentPreview && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Document Preview:
                  </Typography>
                  
                  {documentPreview === 'PDF_FILE' ? (
                    <Box 
                      sx={{ 
                        border: '1px solid #eee',
                        borderRadius: 1,
                        p: 3,
                        textAlign: 'center',
                        backgroundColor: '#f9f9f9'
                      }}
                    >
                      <Typography variant="h6" color="primary" gutterBottom>
                        📄 PDF Document
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {document?.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Size: {document ? Math.round(document.size / 1024) : 0} KB
                      </Typography>
                      <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                        ✓ PDF uploaded successfully
                      </Typography>
                    </Box>
                  ) : documentPreview === 'OTHER_FILE' ? (
                    <Box 
                      sx={{ 
                        border: '1px solid #eee',
                        borderRadius: 1,
                        p: 3,
                        textAlign: 'center',
                        backgroundColor: '#f9f9f9'
                      }}
                    >
                      <Typography variant="h6" color="primary" gutterBottom>
                        📎 Document
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {document?.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Size: {document ? Math.round(document.size / 1024) : 0} KB
                      </Typography>
                      <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                        ✓ File uploaded successfully
                      </Typography>
                    </Box>
                  ) : (
                    <Box 
                      sx={{ 
                        border: '1px solid #eee',
                        borderRadius: 1,
                        p: 1,
                        textAlign: 'center',
                        backgroundColor: '#f9f9f9'
                      }}
                    >
                      <Box 
                        component="img"
                        src={documentPreview}
                        alt="Document preview"
                        sx={{ 
                          maxWidth: '100%',
                          maxHeight: 300,
                          objectFit: 'contain',
                          borderRadius: 1
                        }}
                        onLoad={(e) => {
                          console.log('Image loaded successfully:', e.target.src);
                        }}
                        onError={(e) => {
                          console.error('Image preview failed:', e);
                          console.error('Failed URL:', e.target.src);
                          console.error('Document object:', document);
                          // Fallback to file info display
                          setDocumentPreview('OTHER_FILE');
                        }}
                      />
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        {document?.name}
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        ✓ Image uploaded successfully
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        // Clean up object URL if it exists
                        if (documentPreview && documentPreview !== 'PDF_FILE' && documentPreview !== 'OTHER_FILE') {
                          URL.revokeObjectURL(documentPreview);
                        }
                        setDocument(null);
                        setDocumentPreview(null);
                        // Clear the file input
                        const fileInput = document.getElementById('document-upload');
                        if (fileInput) fileInput.value = '';
                      }}
                      sx={{ mr: 1 }}
                    >
                      Remove Document
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        const fileInput = document.getElementById('document-upload');
                        if (fileInput) fileInput.click();
                      }}
                    >
                      Replace Document
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {activeStep === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Take Selfie
              </Typography>
              <Typography variant="body1" paragraph>
                Please take a selfie using your camera for identity verification.
                For best results, ensure good lighting and hold the camera steady.
              </Typography>

              {/* Photo Quality Tips */}
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  📸 Tips for a good selfie:
                </Typography>
                <Typography variant="body2" component="ul" sx={{ mb: 0, pl: 2 }}>
                  <li>Ensure your face is well-lit (avoid backlighting)</li>
                  <li>Hold the camera steady to avoid blur</li>
                  <li>Look directly at the camera</li>
                  <li>Remove glasses if they cause glare</li>
                  <li>Avoid shadows on your face</li>
                </Typography>
              </Alert>

              {/* Quality Warning */}
              {qualityWarning && (
                <Alert 
                  severity={photoQuality?.overallScore < 50 ? "error" : "warning"} 
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Photo Quality Issue
                  </Typography>
                  <Typography variant="body2">
                    {qualityWarning}
                  </Typography>
                  {photoQuality && (
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                      Quality Score: {photoQuality.overallScore}/100
                    </Typography>
                  )}
                </Alert>
              )}

              <Box sx={{ width: '100%', textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Please allow camera access when prompted by your browser. 
                  Make sure you're using a secure connection (https) or localhost.
                </Typography>
                
                {/* Hidden video element for camera - always rendered for DOM availability */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  width="640"
                  height="480"
                  style={{ 
                    display: (cameraActive || cameraLoading) ? 'block' : 'none',
                    width: '100%', 
                    borderRadius: 8,
                    backgroundColor: '#000',
                    minHeight: '320px',
                    opacity: cameraLoading ? 0.5 : 1
                  }}
                  onCanPlay={() => console.log('Video can play')}
                  onError={(e) => {
                    console.error('Video element error:', e);
                    setError('Video playback error. Please try again.');
                  }}
                />
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
                
                {!cameraActive && !selfiePreview && !cameraLoading && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CameraAltIcon />}
                    onClick={startCamera}
                    sx={{ height: 56, width: '100%', maxWidth: 400 }}
                  >
                    Open Camera for Selfie
                  </Button>
                )}

                {cameraLoading && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography variant="body2" color="textSecondary">
                      Initializing camera...
                    </Typography>
                  </Box>
                )}

                {cameraActive && !cameraLoading && (
                  <Box>
                    {/* Live Quality Feedback */}
                    {liveQuality && (
                      <Box sx={{ 
                        position: 'relative', 
                        mb: 2, 
                        p: 2, 
                        backgroundColor: 'primary.main', 
                        color: 'primary.contrastText', 
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 1
                      }}>
                        <Typography variant="body2">
                          💡 Lighting: {liveQuality.isTooDark ? '🔴 Too Dark' : 
                                      liveQuality.isTooLight ? '🔴 Too Bright' : 
                                      liveQuality.brightness < 80 ? '🟡 Fair' : '🟢 Good'}
                        </Typography>
                        <Typography variant="body2">
                          📷 Sharpness: {liveQuality.isBlurry ? 
                                        (liveQuality.blurScore < 50 ? '🔴 Very Blurry' : '🟡 Blurry') : 
                                        '🟢 Sharp'}
                        </Typography>
                        <Typography variant="body2">
                          ⭐ Quality: {liveQuality.overallScore >= 70 ? '🟢 Good' :
                                     liveQuality.overallScore >= 50 ? '🟡 Fair' : '🔴 Poor'} 
                          ({liveQuality.overallScore}/100)
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', maxWidth: 600, mx: 'auto' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={captureSelfie}
                        startIcon={<CameraAltIcon />}
                        disabled={liveQuality && liveQuality.overallScore < 30} // Disable if quality is too poor
                      >
                        {liveQuality && liveQuality.overallScore < 50 ? 'Capture Anyway' : 'Capture Selfie'}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="large"
                        onClick={stopCamera}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                )}

                
                {selfiePreview && !cameraActive && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setSelfie(null);
                          setSelfiePreview(null);
                          setPhotoQuality(null);
                          setQualityWarning('');
                          startCamera();
                        }}
                      >
                        Retake Selfie
                      </Button>
                    </Box>
                    
                    {photoQuality && (
                      <Box sx={{ mt: 2, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Photo Analysis:
                        </Typography>
                        <Grid container spacing={2} sx={{ textAlign: 'left' }}>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2">
                              <strong>Brightness:</strong> {Math.round(photoQuality.brightness)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2">
                              <strong>Sharpness:</strong> {Math.round(photoQuality.blurScore)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2">
                              <strong>Quality Score:</strong> {photoQuality.overallScore}/100
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2">
                              <strong>Status:</strong> 
                              <span style={{ 
                                color: photoQuality.overallScore >= 70 ? 'green' : 
                                       photoQuality.overallScore >= 50 ? 'orange' : 'red' 
                              }}>
                                {photoQuality.overallScore >= 70 ? ' Good' :
                                 photoQuality.overallScore >= 50 ? ' Fair' : ' Poor'}
                              </span>
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

              {selfiePreview && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Selfie Preview:
                  </Typography>
                  <Box 
                    component="img"
                    src={selfiePreview}
                    alt="Selfie preview"
                    sx={{ 
                      maxWidth: '100%',
                      maxHeight: 300,
                      objectFit: 'contain',
                      border: '1px solid #eee',
                      borderRadius: 1
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {activeStep === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Review and Submit
              </Typography>
              <Typography variant="body1" paragraph>
                Please review your document and selfie before submitting.
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Identity Document:
                  </Typography>
                  {documentPreview ? (
                    <Box 
                      component="img"
                      src={documentPreview}
                      alt="Document preview"
                      sx={{ 
                        width: '100%',
                        maxHeight: 200,
                        objectFit: 'contain',
                        border: '1px solid #eee',
                        borderRadius: 1
                      }}
                    />
                  ) : (
                    <Typography color="error">No document uploaded</Typography>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Selfie:
                  </Typography>
                  {selfiePreview ? (
                    <Box 
                      component="img"
                      src={selfiePreview}
                      alt="Selfie preview"
                      sx={{ 
                        width: '100%',
                        maxHeight: 200,
                        objectFit: 'contain',
                        border: '1px solid #eee',
                        borderRadius: 1
                      }}
                    />
                  ) : (
                    <Typography color="error">No selfie taken</Typography>
                  )}
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="body1" paragraph>
                By clicking "Verify Identity", you agree to our terms and conditions 
                and consent to the processing of your personal data for identity verification purposes.
              </Typography>
            </CardContent>
          </Card>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
            endIcon={activeStep === steps.length - 1 ? <CheckCircleIcon /> : null}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : activeStep === steps.length - 1 ? (
              'Verify Identity'
            ) : (
              'Next'
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default VerificationForm; 