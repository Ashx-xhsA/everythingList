import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyASWP-bg9HqcVJ3oCE29eCXLlcFgUP-2ZE",
  authDomain: "everythinglist-e11fa.firebaseapp.com",
  projectId: "everythinglist-e11fa",
  storageBucket: "everythinglist-e11fa.firebasestorage.app",
  messagingSenderId: "1053852097246",
  appId: "1:1053852097246:web:9253090397bd959027404f",
  // measurementId: "G-KG7KP0L8CL"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
