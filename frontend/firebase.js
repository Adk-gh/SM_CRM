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

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;