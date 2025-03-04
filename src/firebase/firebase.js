// src/firebase/firebase.js
import { initializeApp } from 'firebase/app';

// Firebase設定
// プロジェクト情報: one-morning-jinro (ID: one-morning-jinro, 番号: 105156850862)
const firebaseConfig = {
  apiKey: "AIzaSyAmMuc6g6w7NTOrae_FIilj4hDb7xivKTU",
  authDomain: "one-morning-jinro.firebaseapp.com",
  projectId: "one-morning-jinro",
  storageBucket: "one-morning-jinro.appspot.com",
  messagingSenderId: "105156850862",
  appId: "1:105156850862:web:8bc0eb79e1b5b2fea0693f",
  measurementId: "G-VT955KQE1Q"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);

export { app };
