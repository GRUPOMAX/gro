import { apiGet, apiPatch } from '../../services/api'

// src/utils/enviarNotificacaoGenerica.js
// utils/enviarNotificacaoGenerica.js
export async function enviarNotificacaoGenerica({ id, tipo, titulo, mensagem }) {
  try {
    const payload = { id, tipo, titulo, mensagem }

    const res = await fetch('https://service-notify-sgo.nexusnerds.com.br/notificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    return data
  } catch (err) {
    console.error('❌ Erro no envio da notificação:', err)
    return { sucesso: false, erro: err.message }
  }
}

