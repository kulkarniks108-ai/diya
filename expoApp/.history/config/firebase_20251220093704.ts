// Import the functions you need from the SDKs you need
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';

import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBiJxJDxfdHAC_YHgVXeoq2lPV5Tr5k-eg",
  authDomain: "ndeye-740a8.firebaseapp.com",
  projectId: "ndeye-740a8",
  storageBucket: "ndeye-740a8.firebasestorage.app",
  messagingSenderId: "328019830392",
  appId: "1:328019830392:web:62f2a6c33d48b1d2c16f8d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);



