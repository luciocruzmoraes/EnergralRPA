// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
 apiKey: "AIzaSyCGjNUNIE_9SD1-40znBb2-byHlp95DfxQ",
  authDomain: "projetoenergral.firebaseapp.com",
  projectId: "projetoenergral",
  storageBucket: "projetoenergral.firebasestorage.app",
  messagingSenderId: "623096828141",
  appId: "1:623096828141:web:9adf1b0888b58f6d68bce4",
  measurementId: "G-63X4EF0HPP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

enableIndexedDbPersistence(db).catch(console.warn);

export { auth, db };
