// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth, GoogleAuthProvider} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBvcYkjEEzozNpH6qjN5-8xKXGp5jZPEYg",
  authDomain: "sd-database-19b80.firebaseapp.com",
  projectId: "sd-database-19b80",
  storageBucket: "sd-database-19b80.firebasestorage.app",
  messagingSenderId: "1065056844407",
  appId: "1:1065056844407:web:1aa4644948c3476b15a472",
  measurementId: "G-ZH8LZWRXM7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();