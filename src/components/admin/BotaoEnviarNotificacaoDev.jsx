import { useEffect, useState } from 'react'
import {
  Button, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  Input, Select, useToast
} from '@chakra-ui/react'
import { apiGet } from '../../services/api'
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

  useEffect(() => {
    let buffer = ''
    const handleKeyDown = (e) => {
      if (!e.target.closest('input, textarea')) {
        if (e.key.length === 1) buffer += e.key.toLowerCase()
        else if (e.key === 'Backspace') buffer = buffer.slice(0, -1)
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

  useEffect(() => {
    if (!mostrar) return
    const rota = tipo === 'empresa' ? 'mga2sghx95o3ssp' : 'mpyestriqe5a1kc'
    apiGet(`/api/v2/tables/${rota}/records`).then((res) => {
      setUsuarios(res.list || [])
    })
  }, [tipo, mostrar])

  const enviarNotificacao = async () => {
    if (!idSelecionado || !titulo || !mensagem) {
      toast({ title: 'Preencha todos os campos.', status: 'error' });
      return;
    }
  
    try {
      const filtro = encodeURIComponent(`(UnicID,eq,${idSelecionado})`);
      const tabela = tipo === 'tecnico' ? 'mpyestriqe5a1kc' : 'mga2sghx95o3ssp';
  
      console.log('🔍 Buscando usuário com filtro:', filtro);
      const resBusca = await apiGet(`/api/v2/tables/${tabela}/records?where=${filtro}`);
      const registro = resBusca?.list?.[0];
  
      if (!registro) {
        console.error('❌ Usuário não encontrado no NocoDB');
        toast({ title: 'Usuário não encontrado.', status: 'error' });
        return;
      }
  
      const emailLogado = localStorage.getItem("email_logado") || "";
      const emailDestino = registro?.Email || "";
  
      if (emailLogado === emailDestino) {
        console.warn('⚠️ Você está tentando se notificar.');
        toast({ title: 'Você não deve se notificar.', status: 'warning' });
        return;
      }
  
      let tokens = [];
      try {
        const rawTokens = registro.tokens_fcm;
  
        if (Array.isArray(rawTokens)) {
          tokens = rawTokens.filter(Boolean);
        } else if (typeof rawTokens === 'string') {
          // fallback caso venha como string JSON (pra compatibilidade com registros antigos)
          const parsed = JSON.parse(rawTokens);
          if (Array.isArray(parsed)) tokens = parsed.filter(Boolean);
        }
  
        console.log('📦 Tokens extraídos do NocoDB:', tokens);
      } catch (err) {
        console.warn('⚠️ Erro ao interpretar tokens_fcm:', err);
        tokens = [];
      }
  
      if (tokens.length === 0) {
        console.error('🚫 Nenhum token FCM disponível para esse usuário');
        toast({ title: 'Usuário não possui tokens FCM salvos.', status: 'error' });
        return;
      }
  
      const payload = {
        id: idSelecionado,
        tipo,
        titulo,
        mensagem,
        tokens
      };
  
      console.log('📤 Enviando payload para backend:', payload);
  
      const res = await fetch('https://service-notify-sgo.nexusnerds.com.br/notificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  
      const data = await res.json();
      console.log('📬 Resposta do backend:', data);
  
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
      console.error('🔥 Erro inesperado no envio:', err);
      toast({ title: 'Erro no servidor', status: 'error' });
    }
  };
  
  

  if (!mostrar) return null

  return (
    <>
      <Button
        position="fixed"
        bottom="160px"
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

            <Select
              placeholder="Selecionar usuário"
              value={idSelecionado}
              onChange={(e) => setIdSelecionado(e.target.value)}
            >
              {usuarios.map((u) => (
                <option key={u.UnicID} value={u.UnicID}>
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
