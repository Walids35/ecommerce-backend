import { initializeApp } from 'firebase/app';
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "VOTRE_CLE_API",
  authDomain: "ecommerce-app-a522f.firebaseapp.com",
  projectId: "ecommerce-app-a522f",
  storageBucket: "ecommerce-app-a522f.appspot.com",
  messagingSenderId: "322589722450", // Votre numéro de projet
  appId: "VOTRE_APP_ID_WEB" // L'ID d'application de votre app web Firebase
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app)
