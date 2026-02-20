// js/firebase-init.js
const firebaseConfig = {
  apiKey: "AIzaSyAXv_wKD48EFDe8FBQ-6m0XGUNoxSRiTJY",
  authDomain: "mesa-chef-prod.firebaseapp.com",
  projectId: "mesa-chef-prod",
  storageBucket: "mesa-chef-prod.firebasestorage.app",
  messagingSenderId: "43170330072",
  appId: "1:43170330072:web:bcdd09e39930ad08bf2ead"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

// Habilitar persistencia offline para carga instantánea de datos
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
  if (err.code == 'failed-precondition') {
    console.warn('Persistencia falló: Multiples pestañas abiertas.');
  } else if (err.code == 'unimplemented') {
    console.warn('Persistencia falló: El navegador no lo soporta.');
  }
});

window.db = db; // Exponer globalmente porsiaca

