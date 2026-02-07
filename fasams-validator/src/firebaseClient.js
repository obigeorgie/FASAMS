import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyDOC-TODO-KEY", // TODO: Update with actual key
    authDomain: "fasams-9bd35.firebaseapp.com",
    projectId: "fasams-9bd35",
    storageBucket: "fasams-9bd35.appspot.com",
    messagingSenderId: "1041433592918", // Extracted from garbled output
    appId: "1:1041433592918:web:todo" // TODO: Update with actual app ID
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Connect to specific emulators
// This connects to the local functions emulator
import { connectFunctionsEmulator } from "firebase/functions";

// Check if we are running locally (Vite default port is 5173, but we can check hostname)
if (window.location.hostname === "localhost") {
    connectFunctionsEmulator(functions, "localhost", 5001);
}

export { functions, httpsCallable };
