import {
  Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, Textarea, VStack, ButtonGroup, useDisclosure, useToast
} from '@chakra-ui/react'
import { useState } from 'react'
import { apiGet } from '../../../services/api'


const motivosPadrao = [
  '1001 - Local Fechado',
  '1002 - Chuva',
  '1003 - CDOE Sem Potência',
  '1004 - Sem Viabilidade Técnica'
]
function BotaoPendenciar({ onConfirmar, ordem, ordemId, UnicID_Empresa, ...props }) {

  const { isOpen, onOpen, onClose } = useDisclosure()
  const [motivo, setMotivo] = useState('')
  const toast = useToast()

  

  const handleConfirmar = async () => {
    console.log('🔥 ENTROU NO handleConfirmar')
    console.log('🧠 UnicID_Empresa recebido:', UnicID_Empresa)
  
    if (!motivo.trim()) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Por favor, informe o motivo do pendenciamento.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      })
      return
    }
  
    onConfirmar(motivo)
    onClose()
    setMotivo('')
  
    if (UnicID_Empresa) {
      try {
        const dadosEmpresa = await apiGet(`/api/v2/tables/mga2sghx95o3ssp/records?where=${encodeURIComponent(`(UnicID,eq,${UnicID_Empresa})`)}`);
        const empresa = dadosEmpresa?.list?.[0]
        console.log('🏢 Empresa encontrada:', empresa)
  
        if (!empresa) throw new Error('Empresa não encontrada.')
  
        let tokens = []
        try {
          if (empresa.tokens_fcm?.startsWith?.('[')) {
            const parsed = JSON.parse(empresa.tokens_fcm)
            if (Array.isArray(parsed)) tokens = parsed.filter(Boolean)
          } else {
            tokens = [empresa.tokens_fcm].filter(Boolean)
          }
        } catch (err) {
          console.warn('Erro ao ler tokens da empresa:', err)
        }
  
        if (tokens.length === 0) {
          console.warn('🚫 Nenhum token válido para notificação.')
          return
        }
        const primeiroNome = ordem?.Nome_Cliente?.split(' ')[0] || 'Cliente'

        const payload = {
          id: empresa.UnicID,
          tipo: 'empresa',
          titulo: `Aviso`,
          mensagem: `A O.S. do cliente ${primeiroNome || ''} foi pendenciada. Motivo: ${motivo}`,
          tokens
        }


        console.log('📦 Enviando notificação de pendenciamento:', payload)
  
        const res = await fetch('https://service-notify-sgo.nexusnerds.com.br/notificar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
  
        const data = await res.json()
        if (!data.sucesso) {
          toast({
            title: 'Falha ao notificar',
            description: data.erro || 'Erro desconhecido ao enviar notificação.',
            status: 'error',
            duration: 4000,
            isClosable: true
          })
        }
      } catch (err) {
        console.error('❌ Erro ao enviar notificação de pendenciamento:', err)
        toast({
          title: 'Erro ao notificar',
          description: err.message,
          status: 'error',
          duration: 4000,
          isClosable: true
        })
      }
    } else {
      console.warn('⛔ Nenhum UnicID_Empresa recebido.')
    }
  }
  

  const selecionarMotivoPadrao = (texto) => {
    setMotivo(texto)
  }

  return (
    <>
      <Button onClick={onOpen} colorScheme="yellow" {...props}>
        PENDENCIAR O.S
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Informe o motivo do pendenciamento</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Textarea
              placeholder="Digite o motivo..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              mb={4}
            />

            <VStack align="stretch" spacing={2}>
              {motivosPadrao.map((texto, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => selecionarMotivoPadrao(texto)}
                >
                  {texto}
                </Button>
              ))}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <ButtonGroup spacing={3}>
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button colorScheme="yellow" onClick={handleConfirmar}>
                Confirmar
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default BotaoPendenciar
