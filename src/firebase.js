import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDOyct160ZUefDTcZihI63bswc56RH6c5I",
  authDomain: "congregacion360.firebaseapp.com",
  projectId: "congregacion360", // <--- ¡Este debe ser exactamente congregacion360!
  storageBucket: "congregacion360.firebasestorage.app",
  messagingSenderId: "564218546951",
  appId: "1:564218546951:web:5d880edd1f0935dad753a2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);