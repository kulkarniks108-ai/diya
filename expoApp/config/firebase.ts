import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBiJxJDxfdHAC_YHgVXeoq2lPV5Tr5k-eg",
  authDomain: "ndeye-740a8.firebaseapp.com",
  projectId: "ndeye-740a8",
  storageBucket: "ndeye-740a8.firebasestorage.app",
  messagingSenderId: "328019830392",
  appId: "1:328019830392:web:62f2a6c33d48b1d2c16f8d"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
