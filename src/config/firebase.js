// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth, GoogleAuthProvider} from "firebase/auth";
import {getFirestore} from 'firebase/firestore';
import { getFunctions } from "firebase/functions";

import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: "sd-database-19b80.firebaseapp.com",
  projectId: "sd-database-19b80",
  storageBucket: "sd-database-19b80.firebasestorage.app",
  messagingSenderId: "1065056844407",
  appId: "1:1065056844407:web:1aa4644948c3476b15a472",
  measurementId: "G-ZH8LZWRXM7"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db=getFirestore(app);
export const storage=  getStorage(app);
export const functions = getFunctions(app);
