// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDQj_GLhWFy6doI_HEB6NcwXMn0fk9Wms4",
  authDomain: "site-joao-e-sonaly.firebaseapp.com",
  projectId: "site-joao-e-sonaly",
  storageBucket: "site-joao-e-sonaly.firebasestorage.app",
  messagingSenderId: "797402991845",
  appId: "1:797402991845:web:34a259a5d5577c2abe180c",
  measurementId: "G-236MFXZEWB"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta o Firestore para conexão em tempo real com o App.jsx
export const db = getFirestore(app);