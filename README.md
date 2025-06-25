# Identity Verification System

A web-based system for identity verification using document scanning and face comparison.

## Features

- Extract information from identity documents (Aadhar card)
- Compare document photo with a live selfie
- Determine if the document and person match
- Verify age-based criteria (18+ or not)
- Display confidence level of face match and document parsing

## Technology Stack

### Frontend
- React
- Material-UI
- Axios for API requests
- Webcam integration for selfie capture

### Backend
- Node.js with Express
- Tesseract.js for OCR (Optical Character Recognition)
- face-api.js for face detection and comparison
- PDF parsing for document processing

## Project Structure

```
identity-verification-system/
├── client/                  # Frontend React application
│   ├── public/              # Public assets
│   └── src/                 # React source code
│       ├── components/      # React components
│       └── styles/          # CSS styles
└── server/                  # Backend Node.js application
    ├── models/              # Face-api.js models
    ├── src/                 # Server source code
    └── uploads/             # Temporary storage for uploaded files
```

## Setup Instructions

### Prerequisites
- Node.js (v14+ recommended)
- npm or yarn

### Backend Setup
1. Navigate to the server directory:
   ```
   cd identity-verification-system/server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Download face-api.js models:
   ```
   npm run download-models
   ```

4. Start the server:
   ```
   npm run dev
   ```
   The server will run on http://localhost:5000

### Frontend Setup
1. Navigate to the client directory:
   ```
   cd identity-verification-system/client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```
   The client will run on http://localhost:3000

## Usage

1. Open the application in a web browser
2. Click "Start Verification" on the homepage
3. Upload an identity document (Aadhar card)
4. Take a selfie or upload a photo
5. Review and submit the verification request
6. View the verification results

## Security Considerations

- All uploaded files are temporarily stored and automatically deleted after processing
- No personal data is permanently stored in the system
- For a production environment, implement secure HTTPS connections
- Add proper authentication and authorization mechanisms

## Future Enhancements

- Support for additional document types (PAN, Driving License, etc.)
- Improved OCR accuracy for different document formats
- Enhanced face recognition with liveness detection
- Mobile app integration
- Blockchain-based verification records

## License

This project is licensed under the MIT License - see the LICENSE file for details. 