// firebase-config.js
// Central Firebase initialization for Homemade.
// Uses the modular v12 SDK via <script type="module"> imports (no bundler needed).

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAoKzoPNe3rUDyNvSDjAxg4VOW6PH2kJR4",
  authDomain: "homemade-2b042.firebaseapp.com",
  projectId: "homemade-2b042",
  storageBucket: "homemade-2b042.firebasestorage.app",
  messagingSenderId: "569995460262",
  appId: "1:569995460262:web:6dc0930ad6aa133816fe67",
  measurementId: "G-8D128M6D63"
};

const app = initializeApp(firebaseConfig);

// Analytics can fail in some sandboxed/local contexts, so don't let it block the app.
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Analytics not initialized:", e.message);
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export {
  app,
  analytics,
  auth,
  db,
  storage,
  // auth helpers
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  // firestore helpers
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  // storage helpers
  ref,
  uploadBytes,
  getDownloadURL
};
