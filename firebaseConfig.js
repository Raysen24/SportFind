import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database"; // Realtime DB
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCxbr1lWFSXFayiMOWIb4EezqD6L1DLZMw",
  authDomain: "sportfindapp2.firebaseapp.com",
  projectId: "sportfindapp2",
  storageBucket: "sportfindapp2.appspot.com",
  messagingSenderId: "990247300770",
  appId: "1:990247300770:web:fe8c87da1a5e231deb71fb",
  measurementId: "G-WD45JLBC09"
};

let app;
let auth;
let db;
let rdb;

try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

if (app) {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

    db = getFirestore(app);

    rdb = getDatabase(app, 'https://sportfindapp2-default-rtdb.asia-southeast1.firebasedatabase.app');

    console.log("✅ Firebase initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase services:", error);
  }
} else {
  console.warn("❌ Firebase app not initialized. Some features may not work.");
}

// Debug logs
console.log("Firebase App:", app ? "Initialized" : "Not initialized");
console.log("Firestore (db):", db ? "Initialized" : "Not initialized");
console.log("Realtime DB (rdb):", rdb ? "Initialized" : "Not initialized");

// Export services
export { app, auth, db, rdb };