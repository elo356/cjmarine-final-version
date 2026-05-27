// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC5SVgA7FiOLyTdXCDz1UU_Rz-vqyjlGeY",
    authDomain: "cjmarine-pos.firebaseapp.com",
    projectId: "cjmarine-pos",
    storageBucket: "cjmarine-pos.firebasestorage.app",
    messagingSenderId: "80835779891",
    appId: "1:80835779891:web:16b35990cbda619316b246"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
