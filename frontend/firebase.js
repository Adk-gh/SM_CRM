import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAZkiaiXdLYnbbHiQV0KfwcfQ10ildNCzM",
  authDomain: "crm-db-6f861.firebaseapp.com",
  projectId: "crm-db-6f861",
  storageBucket: "crm-db-6f861.appspot.com",
  messagingSenderId: "691737987459",
  appId: "1:691737987459:web:69c0ef7481b01271f0ceb6",
  measurementId: "G-5DLQ3P9131"
};

console.log('Initializing Firebase...');

const app = initializeApp(firebaseConfig);
console.log('Firebase app initialized:', app);

export const auth = getAuth(app);
console.log('Auth initialized:', auth);

export const db = getFirestore(app);
console.log('Firestore initialized:', db);

console.log('Firebase setup complete');

export default app;