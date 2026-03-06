import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "../config";

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const firestore = getFirestore(app);
