# FASAMS Data Validator

A strict schema validation tool for Florida DCF FASAMS 155-2 Chapter 4 (Client Data) and Chapter 5 (Treatment Episode) requirements.

## Features

- **Strict Validation**: Validates SSN, Medicaid ID, Provider ID, and other fields against official regex using `Ajv`.
- **Auto-Fix**: Uses Google's Gemini 1.5 Flash AI to automatically correct invalid rows to match the schema.
- **Privacy First**: CSV parsing happens entirely in the browser. Data is only sent to the backend when you click "Auto-Fix".

## Setup Instructions

### 1. Frontend Setup
1.  Navigate to `fasams-validator`:
    ```bash
    cd fasams-validator
    npm install
    ```
2.  Open `src/firebaseClient.js` and replace the `firebaseConfig` object with your Firebase Project details.

### 2. Backend (Cloud Functions) Setup
1.  Navigate to the `functions` directory:
    ```bash
    cd ../functions
    npm install
    ```
2.  Set your Gemini API Key in your Firebase environment:
    ```bash
    # For local emulator
    export GEMINI_API_KEY="your_api_key"
    
    # OR for deployment, use Secret Manager
    firebase functions:secrets:set GEMINI_API_KEY
    ```

3.  Deploy the functions:
    ```bash
    cd ..
    firebase deploy --only functions
    ```

### 3. Running Locally
1.  Start the frontend:
    ```bash
    cd fasams-validator
    npm run dev
    ```
2.  (Optional) Start the Firebase Emulators for backend logic locally:
    ```bash
    firebase emulators:start
    ```

## Usage
1.  Open the web app.
2.  Upload a CSV file containing FASAMS client data.
3.  Review any validation errors in the red table.
4.  Click "✨ Auto-Fix Errors" to let Gemini AI repair the data.
5.  Repaired rows will appear in green.
