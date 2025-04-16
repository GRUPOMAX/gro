importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAE_5XmIfLiCi3giZPV-cCrNOq8BvCGvIA",
  authDomain: "sgo-notificacoes.firebaseapp.com",
  projectId: "sgo-notificacoes",
  storageBucket: "sgo-notificacoes.firebasestorage.app",
  messagingSenderId: "691046834283",
  appId: "1:691046834283:web:1e75acee6cbba33f37d12e"
});

const messaging = firebase.messaging();
