// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyAE_5XmIfLiCi3giZPV-cCrNOq8BvCGvIA",
  authDomain: "sgo-notificacoes.firebaseapp.com",
  projectId: "sgo-notificacoes",
  storageBucket: "sgo-notificacoes.firebasestorage.app",
  messagingSenderId: "691046834283",
  appId: "1:691046834283:web:1e75acee6cbba33f37d12e",
  measurementId: "G-CW4KSPGBW8"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Solicita permissão
export const solicitarPermissaoENotificar = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Permissão negada');

    // 🔥 Registra o Service Worker corretamente
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const token = await getToken(messaging, {
      vapidKey: 'BPPTQNhpSdolM8HR4qNPxNvlKB3gPfcps0u2AjZTdN6t-rrwpJU9lgq0sE-_OHbqV_aWeQKcNGUzM42oi1XOXh4',
      serviceWorkerRegistration: registration
    });

    console.log('🔐 Token FCM:', token);
    return token;
  } catch (err) {
    console.error('❌ Erro ao obter permissão/token:', err);
  }
};



export { messaging }
// Escuta notificações com o app aberto
onMessage(messaging, (payload) => {
  console.log('📨 Notificação recebida:', payload);

  // 🔥 Chama a função global se estiver definida
  if (typeof window.mostrarToastNotificacao === 'function') {
    window.mostrarToastNotificacao(payload);
  }
});
