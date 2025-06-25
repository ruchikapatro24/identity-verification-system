import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import theme context
import { CustomThemeProvider, useTheme } from './contexts/ThemeContext';

// Import components
import Header from './components/Header';
import Home from './components/Home';
import VerificationForm from './components/VerificationForm';
import VerificationResult from './components/VerificationResult';

function AppContent() {
  const { theme } = useTheme();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/verify" element={<VerificationForm />} />
          <Route path="/result" element={<VerificationResult />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

function App() {
  return (
    <CustomThemeProvider>
      <AppContent />
    </CustomThemeProvider>
  );
}

export default App; 