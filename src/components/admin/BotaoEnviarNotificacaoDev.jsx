import { useEffect, useState } from 'react'
import {
  Button, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  Input, Select, useToast
} from '@chakra-ui/react'
import { apiGet } from '../../services/api'
import { getToken } from 'firebase/messaging'
import { messaging } from '../../firebase'


function BotaoEnviarNotificacaoDev() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const [usuarios, setUsuarios] = useState([])
  const [tipo, setTipo] = useState('empresa')
  const [idSelecionado, setIdSelecionado] = useState('')
  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [mostrar, setMostrar] = useState(false)

  // Detectar se foi digitado "/dev"
  useEffect(() => {
    let buffer = ''

    const handleKeyDown = (e) => {
      if (!e.target.closest('input, textarea')) {
        if (e.key.length === 1) {
          buffer += e.key.toLowerCase()
        } else if (e.key === 'Backspace') {
          buffer = buffer.slice(0, -1)
        }

        if (buffer.includes('/dev')) {
          setMostrar(true)
          buffer = ''
        }

        if (buffer.length > 20) buffer = buffer.slice(-20)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Buscar os usuários
  useEffect(() => {
    if (!mostrar) return

    if (tipo === 'empresa') {
      apiGet(`/api/v2/tables/mga2sghx95o3ssp/records`).then((res) => {
        setUsuarios(res.list || [])
      })
    } else {
      apiGet(`/api/v2/tables/mpyestriqe5a1kc/records`).then((res) => {
        setUsuarios(res.list || [])
      })
    }
  }, [tipo, mostrar])

// Envie `novoToken` apenas para dispositivos que ainda não salvaram token
const enviarNotificacao = async () => {
  if (!idSelecionado || !titulo || !mensagem) {
    toast({ title: 'Preencha todos os campos.', status: 'error' })
    return
  }

  try {
    const tokenAtual = await getToken(messaging, {
      vapidKey: 'BPPTQNhpSdolM8HR4qNPxNvlKB3gPfcps0u2AjZTdN6t-rrwpJU9lgq0sE-_OHbqV_aWeQKcNGUzM42oi1XOXh4'
    });

    // ✅ O backend já evita duplicatas, mas você pode omitir `novoToken` se não quiser que ele atualize sempre.
    const res = await fetch('http://localhost:33003/notificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: idSelecionado, tipo, titulo, mensagem, novoToken: tokenAtual }) // pode remover esse campo se quiser evitar atualização
    });

    const data = await res.json();

    if (data.sucesso) {
      toast({ title: 'Notificação enviada!', status: 'success' });
      onClose();
      setTitulo('');
      setMensagem('');
      setIdSelecionado('');
    } else {
      toast({ title: 'Erro ao enviar', description: data.erro, status: 'error' });
    }
  } catch (err) {
    console.error('Erro no envio:', err);
    toast({ title: 'Erro no servidor', status: 'error' });
  }
};

  

  if (!mostrar) return null

  return (
    <>
            <Button
            position="fixed"
            bottom="160px" // 👈 Aumenta pra não colidir com o botão azul
            right="24px"
            colorScheme="pink"
            zIndex={1000}
            onClick={onOpen}
            >
            🚀 Enviar Notificação
            </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enviar Notificação</ModalHeader>
          <ModalCloseButton />
          <ModalBody display="flex" flexDirection="column" gap={3}>
            <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="empresa">Empresa</option>
              <option value="tecnico">Técnico</option>
            </Select>

            <Select placeholder="Selecionar usuário" value={idSelecionado} onChange={(e) => setIdSelecionado(e.target.value)}>
                {usuarios.map((u) => (
                    <option key={u.UnicID} value={u.UnicID}> {/* ✅ Agora está correto */}
                    {u.empresa_nome || u.Tecnico_Responsavel || u.nome}
                    </option>
                ))}
                </Select>


            <Input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            <Input placeholder="Mensagem" value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
          </ModalBody>

          <ModalFooter>
            <Button onClick={enviarNotificacao} colorScheme="blue" mr={3}>
              Enviar
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default BotaoEnviarNotificacaoDev
