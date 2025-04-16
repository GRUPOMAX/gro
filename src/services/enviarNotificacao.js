import admin from 'firebase-admin';
import { readFile } from 'fs/promises';

// Lê o JSON com as credenciais
const serviceAccount = JSON.parse(
  await readFile(new URL('./firebase-admin.json', import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function enviarNotificacao(token, titulo, mensagem) {
  const message = {
    token,
    notification: {
        title: 'Teste',
        body: 'Teste',
      },
    android: {
      priority: 'high',
    },
    webpush: {
      headers: {
        Urgency: 'high',
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Notificação enviada:', response);
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);
  }
}

// Exemplo
const tokenFCM = 'dPmpdkdVGpPLnATkFaUF75:APA91bGcnX1EmbrRZ9aUNH4bsmj6pIkrZdpJgQAnfyDhMpLuwgnYaK553lQHfKLnzicCJwmG9zj7802kd6Dl5jfZI3TWne_xTqfyZGOITHzu_6mDu5lE7To';
enviarNotificacao(tokenFCM, '🔔 Nova Ordem!', 'Você tem uma nova ordem de serviço.');
