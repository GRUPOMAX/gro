import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Button,
  IconButton,
  Input,
  VStack,
  Flex,
  useToast,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  useBreakpointValue
} from '@chakra-ui/react'
import { ChatIcon, CloseIcon } from '@chakra-ui/icons'
import { FaPaperPlane } from 'react-icons/fa'
import GloboIAAnimado from './GloboIAAnimado'
import GloboOrbitaHeader from './GloboOrbitaHeader'


export default function AgenteIAFlutuante({ empresasData, forcarAbertura, onFecharAbertura }) {

  const [chatOpen, setChatOpen] = useState(false)
  const [perguntaAtual, setPerguntaAtual] = useState('')
  const [mensagens, setMensagens] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState('Digitando...')
  const mensagensEndRef = useRef(null)
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const isMobile = useBreakpointValue({ base: true, md: false })

  const frasesCarregando = ['Digitando...', 'Analisando dados...', 'Verificando informações...']
  let fraseIndex = 0

  const toggleChat = () => {
    if (isMobile) {
      onOpen()
    } else {
      setChatOpen(!chatOpen)
    }
    if (!chatOpen && !isOpen) {
      enviarMensagemBoasVindas()
    }
  }

  const scrollParaBaixo = () => {
    mensagensEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (forcarAbertura) {
      if (isMobile) {
        onOpen()
      } else {
        setChatOpen(true)
      }
      enviarMensagemBoasVindas()
      onFecharAbertura() // <-- aqui você reseta depois de abrir!
    }
  }, [forcarAbertura])
  
  

  useEffect(() => {
    if (chatOpen || isOpen) {
      scrollParaBaixo()
    }
  }, [mensagens, chatOpen, isOpen])

  useEffect(() => {
    let interval
    if (loading) {
      interval = setInterval(() => {
        fraseIndex = (fraseIndex + 1) % frasesCarregando.length
        setLoadingStatus(frasesCarregando[fraseIndex])
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [loading])

  const enviarMensagemBoasVindas = () => {
    const hora = new Date().getHours()
    const hoje = new Date()
    const diaSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(hoje)

    let saudacao = 'Olá! Como posso ajudá-lo(a)?'

    if (hora >= 5 && hora < 12) {
      saudacao = `Bom dia! Como posso ajudar você nesta manhã de ${diaSemana}?`
    } else if (hora >= 12 && hora < 18) {
      saudacao = `Boa tarde! Em que posso te ajudar nesta tarde de ${diaSemana}?`
    } else {
      saudacao = `Boa noite! Como posso ajudar você nesta noite de ${diaSemana}?`
    }

    setMensagens([{ tipo: 'ia', texto: saudacao }])
  }

  const formatarResposta = (texto) => {
    let textoFormatado = texto
      .replace(/(Empresa:)/g, '<b>$1</b>')
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/(Tipo de Ordem de Serviço:)/g, '<b>$1</b>')
      .replace(/(Cliente:)/g, '<b>$1</b>')
      .replace(/(Telefone[s]* de [Contato|Cliente]*:)/g, '<b>$1</b>')
      .replace(/(Endereço:)/g, '<b>$1</b>')
      .replace(/(Observação da Empresa:)/g, '<b>$1</b>')
      .replace(/(Coordenadas:)/g, '<b>$1</b>')
      .replace(/(Técnico Responsável:)/g, '<b>$1</b>')
      .replace(/(Data de Envio da Ordem de Serviço:|Enviado em:)/g, '<b>$1</b>')
      .replace(/(Número da Ordem de Serviço:)/g, '<b>$1</b>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" style="color: blue; text-decoration: underline;">$1</a>')

    return textoFormatado
  }

  const enviarPergunta = async () => {
    if (!perguntaAtual.trim()) return;
  
    const novaMensagemUsuario = { tipo: 'usuario', texto: perguntaAtual };
    setMensagens(prev => [...prev, novaMensagemUsuario]);
    setPerguntaAtual('');
    setLoading(true);
  
    try {
      const res = await fetch('https://inte.groia.nexusnerds.com.br/assistente-ordens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pergunta: perguntaAtual,
          dados: empresasData,
          historico: mensagens
        })
      });
  
      const data = await res.json();
  
      // ⚡️ Primeiro executa qualquer ação automática
      if (data.acao && data.acao.acao === 'agendar') {
        await realizarAgendamentoAutomatico(data.acao.dados);
      }

      console.log('Resposta completa da IA:', data)



  
      // 👇 Depois exibe a resposta normal
      const respostaIA = {
        tipo: 'ia',
        texto: formatarResposta(data.resposta || 'Não consegui entender 😕')
      };
      setMensagens(prev => [...prev, respostaIA]);
  
      toast({
        title: 'Resposta recebida!',
        status: 'success',
        duration: 1500,
        isClosable: true,
        position: 'top-right',
      });
    } catch (err) {
      console.error('Erro ao consultar IA:', err);
      const erroMensagem = { tipo: 'ia', texto: '⚠️ Erro ao tentar responder.' };
      setMensagens(prev => [...prev, erroMensagem]);
    } finally {
      setLoading(false);
    }
  }
  
  

  const renderizarMensagens = () => (
    <VStack spacing={3} align="stretch" flex="1" overflowY="auto" pr={2}>
      {mensagens.map((msg, idx) => (
        <Flex
          key={idx}
          justify={msg.tipo === 'usuario' ? 'flex-end' : 'flex-start'}
          align="center"
          gap={2}
          px={1}
        >
          {msg.tipo === 'ia' && <GloboIAAnimado pensando={false} />}
  
          {msg.tipo === 'ia' ? (
            <Box
              bg="gray.100"
              p={3}
              borderRadius="20px 20px 20px 0px"
              maxW="80%"
              fontSize="sm"
              textAlign="left"
              whiteSpace="pre-wrap"
              wordBreak="break-word"
              dangerouslySetInnerHTML={{ __html: msg.texto }}
            />
          ) : (
            <Box
              bg="blue.100"
              p={3}
              borderRadius="20px 20px 0px 20px"
              maxW="80%"
              fontSize="sm"
              textAlign="left"
              whiteSpace="pre-wrap"
              wordBreak="break-word"
            >
              {msg.texto}
            </Box>
          )}
        </Flex>
      ))}
  
      {loading && (
        <Flex justify="flex-start" align="center" gap={2} px={1}>
          <GloboIAAnimado pensando={true} />
          <Box
            bg="gray.100"
            p={3}
            borderRadius="20px 20px 20px 0px"
            maxW="80%"
            fontSize="sm"
          >
            <Flex align="center" gap={2}>
              <Spinner size="xs" /> {loadingStatus}
            </Flex>
          </Box>
        </Flex>
      )}
      <div ref={mensagensEndRef} />
    </VStack>
  )



  const realizarAgendamentoAutomatico = async (dados) => {
    try {
      const { unicIdOs, nomeTecnico, dataAgendamento } = dados;
  
      // Buscar o ID do técnico pelo nome
      const idTecnico = await buscarIdTecnicoPorNome(nomeTecnico);
  
      if (!idTecnico) {
        console.error('Técnico não encontrado para o nome:', nomeTecnico);
        return;
      }
  
      // Fazer o POST para o backend agendar
      await fetch('https://inte.groia.nexusnerds.com.br/assistente-ordens/acao-agendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idOrdem: unicIdOs, idTecnico, nomeTecnico, dataAgendamento })
      });
  
      toast({
        title: 'Agendamento realizado!',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    } catch (err) {
      console.error('Erro ao realizar agendamento automático:', err);
    }
  }
  
  const buscarIdTecnicoPorNome = async (nome) => {
    try {
      const res = await fetch('https://inte.groia.nexusnerds.com.br/tecnicos');
      const tecnicos = await res.json();
  
      const tecnico = tecnicos.find(t => t.nome.toLowerCase().includes(nome.toLowerCase()));
      return tecnico?.id || null;
    } catch (err) {
      console.error('Erro ao buscar ID do técnico:', err);
      return null;
    }
  }
  
  
  
  
  


  return (
    <>
      <Box position="fixed" bottom="80px" right="30px" zIndex="9999">
        {!isMobile && (
          <>
            {chatOpen ? (
              <Box
                bg="white"
                p={4}
                shadow="2xl"
                borderRadius="lg"
                w="380px"
                maxH="600px"
                overflow="hidden"
                display="flex"
                flexDirection="column"
              >
                {renderizarMensagens()}
                <Flex mt={3} gap={2}>
                  <Input
                    placeholder="Digite sua pergunta..."
                    value={perguntaAtual}
                    onChange={e => setPerguntaAtual(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') enviarPergunta() }}
                    isDisabled={loading}
                    size="sm"
                    flex="1"
                  />
                  <IconButton
                    colorScheme="blue"
                    onClick={enviarPergunta}
                    size="sm"
                    icon={<FaPaperPlane />}
                    isLoading={loading}
                    aria-label="Enviar pergunta"
                  />
                </Flex>
                <Button
                  leftIcon={<CloseIcon />}
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  mt={2}
                  onClick={toggleChat}
                >
                  Fechar
                </Button>
              </Box>
            ) : (
              <IconButton
                colorScheme="blue"
                aria-label="Abrir Agente IA"
                icon={<ChatIcon />}
                isRound
                size="lg"
                onClick={toggleChat}
                shadow="lg"
              />
            )}
          </>
        )}
      </Box>

      {/* Modal Fullscreen para Mobile */}
      <Modal isOpen={isOpen} onClose={onClose} size="full" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
        <ModalHeader>
            <Flex align="center" justify="center" gap={3}>
            <GloboOrbitaHeader />

              <Box textAlign="center">
                <Box fontWeight="bold" fontSize="lg">
                  Orbita <Box as="span" fontSize="sm" color="gray.500">v1.0</Box>
                </Box>
              </Box>
            </Flex>
          </ModalHeader>
          <ModalBody display="flex" flexDirection="column">
            {renderizarMensagens()}
          </ModalBody>
          <ModalFooter flexDirection="column" gap={2}>
            <Flex gap={2} w="full">
              <Input
                placeholder="Digite sua pergunta..."
                value={perguntaAtual}
                onChange={e => setPerguntaAtual(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter') enviarPergunta() }}
                isDisabled={loading}
                size="md"
                flex="1"
              />
              <IconButton
                colorScheme="blue"
                onClick={enviarPergunta}
                size="md"
                icon={<FaPaperPlane />}
                isLoading={loading}
                aria-label="Enviar pergunta"
              />
            </Flex>
            <Button colorScheme="red" variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
