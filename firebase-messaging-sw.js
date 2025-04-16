// firebase-messaging-sw.js
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

// 🔥 EXIBE A NOTIFICAÇÃO NO MOBILE QUANDO O APP TÁ FECHADO OU EM SEGUNDO PLANO
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem recebida em segundo plano:', payload);

  const { title, body } = payload.notification;

  self.registration.showNotification(title, {
    body: body,
    icon: '/logo.png', // ou outro ícone se preferir
  });
});
