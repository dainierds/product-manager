import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBnpOpJ15VkdMpI6Oi8vyweJIr_4Nnanos",
  authDomain: "product-manager-8e03b.firebaseapp.com",
  projectId: "product-manager-8e03b",
  storageBucket: "product-manager-8e03b.firebasestorage.app",
  messagingSenderId: "50250557307",
  appId: "1:50250557307:web:90813ed5d6ab2787983fde"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
