import {
    Box, Text, Heading, Badge, Flex, Stack, Divider, Button
  } from '@chakra-ui/react'
  import { useToast } from '@chakra-ui/react'
  import { useNavigate } from 'react-router-dom'

  
  import { useParams } from 'react-router-dom'
  import { useLocation } from 'react-router-dom'
  import { useEffect, useState } from 'react'
  import { apiGet, apiPatch } from '../../services/api'
  import BotaoLocalizacao from '../../components/tecnico/botoes/BotaoLocalizacao'
  import BotaoChamarCliente from '../../components/tecnico/botoes/BotaoChamarCliente'
  import BotaoReagendar from '../../components/tecnico/botoes/BotaoReagendar'
  import TecnicoBottomNav from '../../components/tecnico/TecnicoBottomNav'
  import BotaoPendenciar from '../../components/tecnico/botoes/BotaoPendenciar'
  import { corrigirHorario } from '../../components/utils/formatarHorario'; // importa a função

  
  function DetalheOrdemTecnico() {
    const { id } = useParams()
    const [ordem, setOrdem] = useState(null)
    const [loading, setLoading] = useState(true)
    const [deslocamentoIniciado, setDeslocamentoIniciado] = useState(false)
    const [chegueiLocal, setChegueiLocal] = useState(false)
    const toast = useToast()
    const navigate = useNavigate()

    const location = useLocation()
    const ordemNavegacao = location.state?.ordem


  
    useEffect(() => {
      const fetchOrdem = async () => {
        // 🔥 Primeiro tenta pegar a ordem passada na navegação
        if (ordemNavegacao) {
          setOrdem(ordemNavegacao)
  
          if (ordemNavegacao?.Andamento_técnico?.Msg0) {
            setDeslocamentoIniciado(true)
          }
          if (ordemNavegacao?.Andamento_técnico?.Msg2 === 'chegou ao Local') {
            setChegueiLocal(true)
          }
  
          setLoading(false)
          return
        }
  
        // Só tenta buscar da internet se não veio pela navegação
        try {
          const res = await apiGet('/api/v2/tables/mtnh21kq153to8h/records')
          let encontrada = null
  
          res.list.forEach(registro => {
            const raw = registro['Ordem de Serviços']
            const json = typeof raw === 'string' ? JSON.parse(raw) : raw
  
            json.empresas.forEach(emp => {
              emp.Ordens_de_Servico?.forEach(os => {
                if (os.UnicID_OS?.toString() === id) {
                  encontrada = { ...os, empresa: emp.empresa }
                  if (os?.Andamento_técnico?.Msg0) {
                    setDeslocamentoIniciado(true)
                  }
                  if (os?.Andamento_técnico?.Msg2 === 'chegou ao Local') {
                    setChegueiLocal(true)
                  }
                }
              })
            })
          })
  
          setOrdem(encontrada)
  
        } catch (err) {
          console.error('Erro ao buscar ordem:', err)
        } finally {
          setLoading(false)
        }
      }
  
      fetchOrdem()
    }, [id, ordemNavegacao])
    
    function gerarLinkMapa(ordem) {
      if (ordem.LinkLocalizacao) {
        return ordem.LinkLocalizacao
      }
    
      if (ordem.Coordenadas && ordem.Coordenadas.includes(',')) {
        const [lat, lng] = ordem.Coordenadas.split(',').map(coord => coord.trim())
        return `https://www.google.com/maps/@${lat},${lng},17z`
      }
    
      if (ordem.Geolocalizacao?.latitude && ordem.Geolocalizacao?.longitude) {
        return `https://www.google.com/maps/@${ordem.Geolocalizacao.latitude},${ordem.Geolocalizacao.longitude},17z`
      }
    
      return null
    }
    

      
  
    const handleIniciarDeslocamento = async () => {
      try {
        const res = await apiGet('/api/v2/tables/mtnh21kq153to8h/records')
        console.log('🔍 Registros retornados:', res.list)
  
        let recordId = null
        let novaListaEmpresas = []
        let registroEncontrado = null
  
        for (const registro of res.list) {
          const raw = registro['Ordem de Serviços']
          const json = typeof raw === 'string' ? JSON.parse(raw) : raw
          console.log('📦 JSON parseado:', json)
  
          const empresasAtualizadas = json.empresas.map(emp => {
            const ordensAtualizadas = emp.Ordens_de_Servico?.map(os => {
              console.log('🧾 Verificando OS:', os.UnicID_OS)
  
              if (os.UnicID_OS === ordem.UnicID_OS && os.Numero_OS === ordem.Numero_OS) {
                console.log('✅ Encontrou OS:', os.UnicID_OS)
                recordId = registro.id || registro.Id
                registroEncontrado = registro
  
                const agora = new Date().toISOString()
                return {
                  ...os,
                  Andamento_técnico: {
                    ...os.Andamento_técnico,
                    Msg0: `Iniciou a O.S ${agora}`,
                    Msg1: `Técnico em Deslocamento`
                  }
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
          console.warn('⚠️ Registro da O.S não foi encontrado para:', ordem.UnicID_OS)
          toast({
            title: 'Erro',
            description: 'Registro da O.S não encontrado.',
            status: 'error',
            duration: 4000,
            isClosable: true
          })
          return
        }
  
        const payload = [
          {
            Id: registroEncontrado.Id,
            'Ordem de Serviços': JSON.stringify({ empresas: novaListaEmpresas })
          }
        ]
  
        console.log('📤 Enviando PATCH com body:', payload)
  
        await apiPatch(`/api/v2/tables/mtnh21kq153to8h/records`, payload)
  
        toast({
          title: '🚗 Deslocamento iniciado!',
          description: 'O técnico está a caminho do cliente.',
          status: 'success',
          duration: 4000,
          isClosable: true
        })
        setDeslocamentoIniciado(true)
      } catch (error) {
        console.error('❌ Erro ao iniciar deslocamento:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível iniciar o deslocamento.',
          status: 'error',
          duration: 4000,
          isClosable: true
        })
      }
    }

    const handleCheguei = async () => {
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
                if (os.UnicID_OS === ordem.UnicID_OS && os.Numero_OS === ordem.Numero_OS) {
                  console.log('📍 CHEGUEI — Atualizando OS:', os.UnicID_OS)
                  recordId = registro.id || registro.Id
                  registroEncontrado = registro
      
                  const agora = new Date().toISOString()
                  return {
                    ...os,
                    Status_OS: 'Execução',
                    Andamento_técnico: {
                      ...os.Andamento_técnico,
                      Msg2: 'chegou ao Local',
                      Msg3: 'O.S em Execução'
                    }
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
              description: 'Registro da O.S não encontrado ao chegar.',
              status: 'error',
              duration: 4000,
              isClosable: true
            })
            return
          }
      
          const payload = [
            {
              Id: registroEncontrado.Id,
              'Ordem de Serviços': JSON.stringify({ empresas: novaListaEmpresas })
            }
          ]
      
          console.log('📤 Enviando PATCH CHEGUEI:', payload)
      
          await apiPatch(`/api/v2/tables/mtnh21kq153to8h/records`, payload)
      
          toast({
            title: '📍 Técnico chegou ao local!',
            description: 'O status foi atualizado para Execução.',
            status: 'success',
            duration: 4000,
            isClosable: true
          })
      
          // Atualiza estado para refletir novo status local
          setOrdem(prev => ({
            ...prev,
            Status_OS: 'Execução',
            Andamento_técnico: {
              ...(prev.Andamento_técnico || {}),
              Msg2: 'chegou ao Local',
              Msg3: 'O.S em Execução'
            }
          }))
          setChegueiLocal(true)
        } catch (error) {
          console.error('❌ Erro ao atualizar para Chegou:', error)
          toast({
            title: 'Erro',
            description: 'Não foi possível atualizar o status.',
            status: 'error',
            duration: 4000,
            isClosable: true
          })

        }
      }

      const handlePendenciar = async (motivoPendenciamento) => {
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
                if (os.UnicID_OS === ordem.UnicID_OS && os.Numero_OS === ordem.Numero_OS) {
                  recordId = registro.id || registro.Id
                  registroEncontrado = registro
      
                  return {
                    ...os,
                    Status_OS: 'Pendenciada',
                    Motivo_Pendenciamento: motivoPendenciamento, // ✅ AQUI AGORA REALMENTE SETANDO!
                    Andamento_técnico: {
                      ...(os.Andamento_técnico || {}),
                      Msg4: 'O.S Pendenciada'
                    }
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
              description: 'Registro da O.S não encontrado para pendenciar.',
              status: 'error',
              duration: 4000,
              isClosable: true
            })
            return
          }
      
          const payload = [
            {
              Id: registroEncontrado.Id,
              'Ordem de Serviços': JSON.stringify({ empresas: novaListaEmpresas }) // agora vai certinho o novo motivo
            }
          ]
      
          console.log('📤 PATCH FINALIZAR pendenciar OS:', payload)
      
          await apiPatch(`/api/v2/tables/mtnh21kq153to8h/records`, payload)
      
          toast({
            title: '🔁 O.S Pendenciada!',
            description: 'O status da ordem foi atualizado com sucesso!',
            status: 'success',
            duration: 4000,
            isClosable: true
          })
      
          setOrdem(prev => ({
            ...prev,
            Status_OS: 'Pendenciada',
            Motivo_Pendenciamento: motivoPendenciamento, // 🛠️ Atualiza no front também
            Andamento_técnico: {
              ...(prev.Andamento_técnico || {}),
              Msg4: 'O.S Pendenciada'
            }
          }))
        } catch (error) {
          console.error('❌ Erro ao pendenciar:', error)
          toast({
            title: 'Erro',
            description: 'Não foi possível pendenciar a O.S.',
            status: 'error',
            duration: 4000,
            isClosable: true
          })
        }
      }
      

        
      

      
  
    const getCorStatus = (status) => {
      const s = status?.toLowerCase()
      if (s.includes('final')) return 'green'
      if (s.includes('pend')) return 'yellow'
      if (s.includes('cancel')) return 'red'
      if (s.includes('exec')) return 'orange'
      if (s.includes('atrib')) return 'blue'
      if (s.includes('imp')) return 'gray'
      return 'gray'
    }
  
    const separarEndereco = (endereco) => {
      if (!endereco) return {}
      const partes = endereco.split(',')
      return {
        rua: partes[0]?.trim(),
        numero: partes[1]?.replace('nº', '').trim(),
        bairro: partes[2]?.trim(),
        cidadeEstado: partes[3]?.trim()
      }
    }
  
    if (loading) return <Text mt={4}>Carregando...</Text>
    if (!ordem) return <Text mt={4}>Ordem não encontrada.</Text>
  
    const endereco = separarEndereco(ordem.Endereco_Cliente)
  
    return (
      <Box p={4} pb="100px">
        <Heading size="md" mb={1}>O.S DA {ordem.empresa}</Heading>
        <Badge colorScheme={getCorStatus(ordem.Status_OS)} mb={4}>
          {ordem.Status_OS?.toUpperCase()}
        </Badge>
  
        <Divider mb={4} />
  
        <Stack spacing={3}>
          <Text><strong>Cliente:</strong> {ordem.Nome_Cliente}</Text>
          <Text><strong>Tipo:</strong> {ordem.Tipo_OS}</Text>
          <Text><strong>Horário: </strong> 
              {ordem.Horario_Agendamento_OS 
                ? corrigirHorario(ordem.Horario_Agendamento_OS).split('T')[1]?.slice(0, 5) || corrigirHorario(ordem.Horario_Agendamento_OS).split(' ')[1]
                : 'Não informado'}
            </Text>

          <Divider />
  
          <Text fontWeight="bold">📍 Endereço:</Text>
          <Text><strong>Rua:</strong> {endereco.rua}</Text>
          <Text><strong>Número:</strong> {endereco.numero}</Text>
          <Text><strong>Bairro:</strong> {endereco.bairro}</Text>
          <Text><strong>Cidade/Estado:</strong> {endereco.cidadeEstado}</Text>
  
          {ordem.Referencia && <Text><strong>Referência:</strong> {ordem.Referencia}</Text>}
          {ordem.Complemento && <Text><strong>Complemento:</strong> {ordem.Complemento}</Text>}
  
          <Divider />
          <Text><strong>Descrição:</strong> {ordem.Observacao_Empresa || 'Não informada'}</Text>
          </Stack>
  
        <Flex direction="column" gap={2} mt={6}>
            <Flex gap={2}>
            <BotaoLocalizacao
                link={gerarLinkMapa(ordem)}
                fallbackEndereco={ordem.Endereco_Cliente}
              />


              <BotaoChamarCliente telefone1={ordem.Telefone1_Cliente} telefone2={ordem.Telefone2_Cliente} flex="1" />
            </Flex>

            {/* Só mostra Reagendar e Pendenciar se NÃO for finalizada */}
            {ordem.Status_OS?.toLowerCase() !== 'finalizado' && (
              <Flex gap={2} mt={2}>
                <BotaoReagendar ordem={ordem} flex="1" />
                {chegueiLocal && (
                  <BotaoPendenciar
                        flex="1"
                        ordem={ordem} // ✅ envia ordem completa
                        ordemId={ordem.UnicID_OS}
                        UnicID_Empresa={ordem.UnicID_Empresa}
                        onConfirmar={(motivo) => handlePendenciar(motivo)}
                      />



                )}
              </Flex>
            )}
          </Flex>


  
            {!['improdutivas', 'cancelado', 'pendente','finalizado'].includes(ordem.Status_OS?.toLowerCase()) && (
            <Box mt={8}>
              {/* Se ainda não iniciou o deslocamento */}
              {!deslocamentoIniciado && (
                <Button
                  colorScheme="green"
                  w="100%"
                  size="lg"
                  onClick={handleIniciarDeslocamento}
                >
                  INICIAR DESLOCAMENTO
                </Button>
              )}

              {/* Se iniciou o deslocamento, mas ainda não chegou */}
              {deslocamentoIniciado && !chegueiLocal && (
                <Button
                  colorScheme="blue"
                  w="100%"
                  size="lg"
                  onClick={handleCheguei}
                  mt={3}
                >
                  CHEGUEI
                </Button>
              )}

              {/* Se já chegou no local */}
              {chegueiLocal && (
                <Button
                  colorScheme="red"
                  w="100%"
                  size="lg"
                  onClick={() => navigate(`/tecnico/finalizar-os/${ordem.UnicID_OS}`)}
                  mt={3}
                >
                  FINALIZAR O.S
                </Button>
              )}
            </Box>
          )}

  
        <TecnicoBottomNav />
      </Box>
    )
  }
  
  export default DetalheOrdemTecnico