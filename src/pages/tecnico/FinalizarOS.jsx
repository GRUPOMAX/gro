import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Box, Heading, Textarea, Button, Text, useToast, Flex, Progress } from '@chakra-ui/react'
import { apiGet, apiPatch } from '../../services/api'
import UploadFotosEvidencias from '../../components/tecnico/finalizar/UploadFotosEvidencias'
import MateriaisUtilizadosStep from '../../components/tecnico/finalizar/MateriaisUtilizadosStep'

import TecnicoBottomNav from '../../components/tecnico/TecnicoBottomNav'

function FinalizarOS() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [stepAtual, setStepAtual] = useState(0)
  const [evidencias, setEvidencias] = useState({})
  const [observacao, setObservacao] = useState('')
  const [materiais, setMateriais] = useState({})
  const [loading, setLoading] = useState(false)

  const passos = ['Evidências', 'Materiais Utilizados', 'Finalizar Ordem']

  const avancar = () => setStepAtual(prev => Math.min(prev + 1, passos.length - 1))
  const voltar = () => setStepAtual(prev => Math.max(prev - 1, 0))

  const handleFinalizar = async () => {
    if (!observacao.trim()) {
      toast({
        title: 'Preencha a observação.',
        description: 'Você precisa adicionar uma observação antes de finalizar.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      })
      return
    }

    if (Object.keys(evidencias).length === 0) {
      toast({
        title: 'Adicione pelo menos uma foto.',
        description: 'É necessário enviar evidências da execução.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      })
      return
    }

    setLoading(true)

    try {
      const res = await apiGet('/api/v2/tables/mtnh21kq153to8h/records')

      let registroEncontrado = null
      let recordId = null
      let novaListaEmpresas = []

      for (const registro of res.list) {
        const raw = registro['Ordem de Serviços']
        const json = typeof raw === 'string' ? JSON.parse(raw) : raw

        const empresasAtualizadas = json.empresas.map(emp => {
          const ordensAtualizadas = emp.Ordens_de_Servico?.map(os => {
            if (os.UnicID_OS === id) {
              recordId = registro.id || registro.Id
              registroEncontrado = registro

              return {
                ...os,
                Status_OS: 'Finalizado',
                Andamento_técnico: {
                  ...os.Andamento_técnico,
                  Msg4: 'O.S Finalizada'
                },
                Observacao_Tecnico: observacao,
                Evidencias: evidencias,
                Materiais_Utilizados: materiais,
                Data_Entrega_OS: new Date().toISOString() // 🆕 Aqui atualiza a Data de Entrega
              }
            }
            return os
          })

          return {
            ...emp,
            Ordens_de_Servico: ordensAtualizadas
          }
        })

        if (recordId) {
          novaListaEmpresas = empresasAtualizadas
          break
        }
      }

      if (!recordId || !registroEncontrado) {
        toast({
          title: 'Erro',
          description: 'Registro da O.S não encontrado.',
          status: 'error',
          duration: 4000,
          isClosable: true
        })
        setLoading(false)
        return
      }

      const payload = [
        {
          Id: registroEncontrado.Id,
          'Ordem de Serviços': JSON.stringify({ empresas: novaListaEmpresas })
        }
      ]

      console.log('📤 PATCH FINALIZAR O.S:', payload)



      await apiPatch(`/api/v2/tables/mtnh21kq153to8h/records`, payload)

      // 🔔 Envia notificação após finalizar O.S
          try {
            const dadosEmpresa = await apiGet(`/api/v2/tables/mga2sghx95o3ssp/records?where=${encodeURIComponent(`(UnicID,eq,${novaListaEmpresas?.find(e => e.Ordens_de_Servico?.some(os => os.UnicID_OS === id))?.UnicID_Empresa || ''})`)}`)
            const empresa = dadosEmpresa?.list?.[0]

            if (empresa && empresa.tokens_fcm) {
              let tokens = []
              try {
                if (empresa.tokens_fcm?.startsWith?.('[')) {
                  tokens = JSON.parse(empresa.tokens_fcm).filter(Boolean)
                } else {
                  tokens = [empresa.tokens_fcm].filter(Boolean)
                }
              } catch (e) {
                console.warn('Erro ao interpretar tokens FCM:', e)
              }

              if (tokens.length > 0) {
                const ordemFinalizada = novaListaEmpresas
                  .flatMap(e => e.Ordens_de_Servico)
                  .find(os => os.UnicID_OS === id)

                const primeiroNome = ordemFinalizada?.Nome_Cliente?.split(' ')[0] || 'Cliente'

                const payload = {
                  id: empresa.UnicID,
                  tipo: 'empresa',
                  titulo: `✅ O.S Finalizada Com Sucesso!`,
                  mensagem: `A ordem ${primeiroNome} foi concluída com sucesso.`,
                  tokens
                }

                await fetch('https://service-notify-sgo.nexusnerds.com.br/notificar', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                })
              }
            }
          } catch (e) {
            console.error('❌ Falha ao enviar notificação de finalização:', e)
          }


      toast({
        title: '✅ Ordem finalizada com sucesso!',
        description: 'O status foi atualizado para Finalizado.',
        status: 'success',
        duration: 4000,
        isClosable: true
      })

      navigate('/tecnico')  // 👉 redireciona para o painel inicial do técnico
    } catch (error) {
      console.error('❌ Erro ao finalizar O.S:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível finalizar a ordem.',
        status: 'error',
        duration: 4000,
        isClosable: true
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex direction="column" height="100vh" overflow="hidden">
      <Box flex="1" p={4} overflowY="auto">
      <Heading size="md" mb={4}>Finalizar Ordem de Serviço</Heading>

      <Text mb={2}><strong>Etapa:</strong> {passos[stepAtual]}</Text>
      <Progress value={(stepAtual + 1) * (100 / passos.length)} mb={6} />

      {stepAtual === 0 && (
        <>
          <Text mb={4}>📸 Faça o upload das fotos e adicione comentários:</Text>
          <UploadFotosEvidencias evidencias={evidencias} setEvidencias={setEvidencias} />
        </>
      )}

      {stepAtual === 1 && (
        <>
          <Text mb={4}>📦 Informe os materiais utilizados:</Text>
          <MateriaisUtilizadosStep materiais={materiais} setMateriais={setMateriais} />
        </>
      )}

      {stepAtual === 2 && (
        <>
          <Text mb={2}>📝 Adicione uma observação geral sobre a finalização:</Text>
          <Textarea
          
            placeholder="Digite aqui..."
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
            mb={6}
            minHeight="120px"
            maxHeight="120px"
            overflowY="auto"
          />
        </>
      )}

      <Flex mt={6} gap={4}>
        {stepAtual > 0 && (
          <Button onClick={voltar} variant="outline" w="100%">Voltar</Button>
        )}

        {stepAtual < passos.length - 1 && (
          <Button onClick={avancar} colorScheme="blue" w="100%">Avançar</Button>
        )}

        {stepAtual === passos.length - 1 && (
          <Button
            colorScheme="green"
            w="100%"
            isLoading={loading}
            onClick={handleFinalizar}
          >
            Finalizar O.S
          </Button>
        )}
      </Flex>
        {/* Espaço para afastar do BottomNav */}
        <Box h="90px" /> {/* Você pode ajustar para 80px, 90px, etc, para ficar bonito no seu app */}

      <TecnicoBottomNav />
    </Box>
    </Flex>
  )
}

export default FinalizarOS
