import { useEffect, useState } from 'react'
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Badge,
  useToast,
  useBreakpointValue,
  Flex // 👈 adiciona aqui
} from '@chakra-ui/react'
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, ModalFooter, Button, Textarea
  } from '@chakra-ui/react'

import { CopyIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import { Tooltip, IconButton, HStack, Link } from '@chakra-ui/react'
import { DownloadIcon } from '@chakra-ui/icons'


import { useDisclosure } from '@chakra-ui/react'
import { Select } from '@chakra-ui/react' // certifique-se de importar
import { Collapse } from '@chakra-ui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'



import { apiGet, apiPatch  } from '../services/api'
import AdminSidebarDesktop from '../components/admin/AdminSidebarDesktop'
import AdminBottomNav from '../components/admin/AdminBottomNav'
import AdminMobileMenu from '../components/admin/AdminMobileMenu'

function OrdensEmAberto() {
  const [ordens, setOrdens] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const isMobile = useBreakpointValue({ base: true, md: false })
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [ordemSelecionada, setOrdemSelecionada] = useState(null)
  const [mensagemAndamento, setMensagemAndamento] = useState('')
  const [novoStatus, setNovoStatus] = useState('')
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false) // ✅ ADICIONE ISSO

  const { isOpen: isOpenObservacao, onOpen: onOpenObservacao, onClose: onCloseObservacao } = useDisclosure()
  const [novaObservacao, setNovaObservacao] = useState('')

  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [statusSelecionado, setStatusSelecionado] = useState('') // <-- 👈 filtro novo aqui!



  useEffect(() => {
    const fetchOrdens = async () => {
      try {
        const res = await apiGet('/api/v2/tables/mtnh21kq153to8h/records')
  
        const ordens = res.list.flatMap(item => {
          const rawJson = item['Ordem de Serviços']
          if (!rawJson) return []
          const json = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson
          if (!json?.empresas) return []
          return json.empresas.flatMap(empresa =>
            empresa.Ordens_de_Servico.map(os => ({
              ...os,
              empresa: empresa.empresa,
              UnicID_Empresa: empresa.UnicID_Empresa
            }))
          )
        })
  
        setOrdens(ordens)
      } catch (err) {
        console.error('Erro ao buscar ordens:', err)
        toast({
          title: 'Erro ao buscar ordens',
          status: 'error',
          duration: 3000
        })
      } finally {
        setLoading(false)
      }
    }
  
    // Carrega inicialmente
    fetchOrdens()
  
    // Atualiza automaticamente a cada 10 segundos
    const interval = setInterval(fetchOrdens, 10000)
  
    // Limpa o intervalo se sair da tela
    return () => clearInterval(interval)
  }, [])


  useEffect(() => {
    const hoje = new Date()
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
  
    setDataInicial(primeiroDia.toISOString().slice(0, 10))
    setDataFinal(ultimoDia.toISOString().slice(0, 10))
    setStatusSelecionado('Em Aberto')
  }, [])
  

  const salvarAlteracaoNoBanco = async () => {
    try {
      const res = await apiGet('/api/v2/tables/mtnh21kq153to8h/records')
      const registro = res.list.find(item =>
        JSON.stringify(item['Ordem de Serviços']).includes(ordemSelecionada.UnicID_OS)
      )
  
      if (!registro) throw new Error('Registro não encontrado.')
  
      // Parse do JSON interno
      const jsonOriginal = typeof registro['Ordem de Serviços'] === 'string'
        ? JSON.parse(registro['Ordem de Serviços'])
        : registro['Ordem de Serviços']
  
      // Atualiza a OS dentro da empresa
      const novaEstrutura = {
        ...jsonOriginal,
        empresas: jsonOriginal.empresas.map(empresa => {
          if (empresa.UnicID_Empresa !== ordemSelecionada.UnicID_Empresa) return empresa
  
          return {
            ...empresa,
            Ordens_de_Servico: empresa.Ordens_de_Servico.map(os =>
              os.UnicID_OS === ordemSelecionada.UnicID_OS
                ? {
                    ...os,
                    Status_OS: novoStatus,
                    Observacao_Administrador: (() => {
                      const obsAntigas = typeof os.Observacao_Administrador === 'object'
                        ? os.Observacao_Administrador
                        : { Msg0: os.Observacao_Administrador }
                    
                      const novaMsgKey = `Msg${Object.keys(obsAntigas).length}`
                      const justificativa = ['Cancelado', 'Improdutiva'].includes(novoStatus)
                        ? novaObservacao.trim() || 'Sem justificativa informada'
                        : mensagemAndamento
                    
                      return {
                        ...obsAntigas,
                        [novaMsgKey]: justificativa
                      }
                    })()
                  }
                : os
            )
          }
        })
      }
  
      // PATCH com a estrutura nova
      await apiPatch('/api/v2/tables/mtnh21kq153to8h/records', {
        Id: registro.Id,
        'Ordem de Serviços': novaEstrutura
      })
        // 🔔 Envia notificação
        const dadosEmpresa = await apiGet(`/api/v2/tables/mga2sghx95o3ssp/records?where=${encodeURIComponent(`(UnicID,eq,${ordemSelecionada.UnicID_Empresa})`)}`);
        const empresa = dadosEmpresa?.list?.[0];

        if (empresa && empresa.tokens_fcm) {
          let tokens = [];
          try {
            if (empresa.tokens_fcm?.startsWith?.('[')) {
              const parsed = JSON.parse(empresa.tokens_fcm);
              if (Array.isArray(parsed)) tokens = parsed.filter(Boolean);
            } else {
              tokens = [empresa.tokens_fcm].filter(Boolean);
            }
          } catch (err) {
            console.warn('Erro ao ler tokens da empresa:', err);
          }

          if (tokens.length > 0) {
            const payload = {
              id: empresa.UnicID,
              tipo: 'empresa',
              titulo: '⚠️ Status da O.S atualizado!',
              mensagem: `O status da sua ordem foi alterado para: ${novoStatus}`,
              tokens
            };

            console.log('📦 Enviando notificação após mudança de status:', payload);

            try {
              await fetch('http://localhost:33003/notificar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
            } catch (err) {
              console.error('❌ Erro ao enviar notificação de status:', err);
            }
          }
        }

  
      toast({
        title: 'Ordem salva no banco!',
        status: 'success',
        duration: 3000
      })
    } catch (err) {
      console.error('Erro ao salvar:', err)
      toast({
        title: 'Erro ao salvar no banco',
        status: 'error',
        duration: 3000
      })
    }
  }

  const salvarNovaObservacao = async () => {
    try {
      const res = await apiGet('/api/v2/tables/mtnh21kq153to8h/records')
      const registro = res.list.find(item =>
        JSON.stringify(item['Ordem de Serviços']).includes(ordemSelecionada.UnicID_OS)
      )
      if (!registro) throw new Error('Registro não encontrado.')
  
      const json = typeof registro['Ordem de Serviços'] === 'string'
        ? JSON.parse(registro['Ordem de Serviços'])
        : registro['Ordem de Serviços']
  
      const novaEstrutura = {
        ...json,
        empresas: json.empresas.map(empresa => {
          if (empresa.UnicID_Empresa !== ordemSelecionada.UnicID_Empresa) return empresa
  
          return {
            ...empresa,
            Ordens_de_Servico: empresa.Ordens_de_Servico.map(os => {
              if (os.UnicID_OS !== ordemSelecionada.UnicID_OS) return os
  
              const obs = typeof os.Observacao_Administrador === 'object' ? os.Observacao_Administrador : { Msg0: os.Observacao_Administrador }
  
              const nextKey = `Msg${Object.keys(obs).length}`
              return {
                ...os,
                Observacao_Administrador: {
                  ...obs,
                  [nextKey]: novaObservacao
                }
              }
            })
          }
        })
      }
  
      await apiPatch('/api/v2/tables/mtnh21kq153to8h/records', {
        Id: registro.Id,
        'Ordem de Serviços': novaEstrutura
      })
  
      toast({ title: 'Observação adicionada!', status: 'success', duration: 3000 })
      onCloseObservacao()
      setNovaObservacao('')
      onClose()  // fecha modal
      setTimeout(() => {
        window.location.reload() // 🔥 força recarregar toda tela
      }, 1000) // espera 1 segundo para reload depois do toast

    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao adicionar observação', status: 'error', duration: 3000 })
    }
  }
  


  return (

    <Box display="flex">
      {!isMobile && <AdminSidebarDesktop />}
      {isMobile && <AdminMobileMenu />}

      <Box
        p={6}
        ml={!isMobile ? '250px' : 0}
        w="full"
        pb={isMobile ? '60px' : 0}
      >
        {isMobile && <AdminBottomNav />}

        <Heading size="lg" mb={4}>Todas as Ordens</Heading>

        <Flex mb={4} gap={4} align="center" flexWrap="wrap">
              <Box>
                <Text fontSize="sm" mb={1}>Data Inicial</Text>
                <input
                  type="date"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                  style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
                />
              </Box>

              <Box>
                <Text fontSize="sm" mb={1}>Data Final</Text>
                <input
                  type="date"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                  style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
                />
              </Box>



          <Box>
            <Text fontSize="sm" mb={1}>Filtrar por Status</Text>
            <Select
              placeholder="Todos os Status"
              value={statusSelecionado}
              onChange={(e) => setStatusSelecionado(e.target.value)}
              w="200px"
            >
              <option value="Em Aberto">Em Aberto</option>
              <option value="Atribuido">Atribuído</option>
              <option value="Enviado">Enviado</option>
              <option value="Execução">Execução</option>
              <option value="Pendente">Pendente</option>
              <option value="Improdutivo">Improdutivo</option>
              <option value="Cancelado">Cancelado</option>
              <option value="Agendada">Agendada</option>
              <option value="Finalizado">Finalizado</option>
            </Select>
          </Box>
        </Flex>


            

        {loading ? (
          <Spinner size="xl" />
        ) : (
          <VStack align="stretch" spacing={4}>
            {ordens
              .filter((os) => {
                const dataEnvio = new Date(os.Data_Envio_OS)
                const inicio = dataInicial ? new Date(dataInicial + 'T00:00:00') : null
                const fim = dataFinal ? new Date(dataFinal + 'T23:59:59') : null

                let dentroDoPeriodo = true

                if (inicio && fim) {
                  dentroDoPeriodo = dataEnvio >= inicio && dataEnvio <= fim
                } else if (inicio) {
                  dentroDoPeriodo = dataEnvio >= inicio
                } else if (fim) {
                  dentroDoPeriodo = dataEnvio <= fim
                }

                const statusCorreto = !statusSelecionado || os.Status_OS === statusSelecionado

                return dentroDoPeriodo && statusCorreto
              })
              .map((os) => {
              const dataEnvio = new Date(os.Data_Envio_OS)
              const agora = new Date()
              const diferencaMinutos = (agora - dataEnvio) / (1000 * 60)
              const ordemNova = diferencaMinutos <= 5 // ⚡ Nova se criada nos últimos 5 min

              return (
                <Box
                  key={os.UnicID_OS}
                  p={4}
                  borderWidth="1px"
                  borderRadius="md"
                  bg={ordemNova ? "purple.50" : "white"} // muda fundo se for nova
                  boxShadow={ordemNova ? "md" : "sm"} // sombra maior se nova
                  borderColor={ordemNova ? "purple.300" : "gray.200"}
                  position="relative"
                  transition="all 0.2s"
                  _hover={{
                    boxShadow: 'md',
                    cursor: 'pointer',
                    bg: ordemNova ? "purple.100" : "gray.50"
                  }}
                  onClick={() => {
                    setOrdemSelecionada(os)
                    setMensagemAndamento(os.Observacao_Administrador || '')
                    setNovoStatus(os.Status_OS)
                    onOpen()
                  }}
                >

                  {/* Badge indicando que é nova */}
                  {ordemNova && (
                    <Badge
                      colorScheme="purple"
                      position="absolute"
                      top={2}
                      left={2}
                      borderRadius="full"
                      px={2}
                      py={1}
                      fontSize="xs"
                      animation="pulse 2s infinite"
                    >
                      NOVA ORDEM
                    </Badge>
                  )}

                  {/* Botão no canto superior (só desktop) */}
                  {!isMobile && (
                    <Box position="absolute" top={2} right={2} zIndex={1}>
                      <Button
                        size="sm"
                        colorScheme="purple"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOrdemSelecionada(os)
                          onOpenObservacao()
                        }}
                      >
                        Adicionar Observação
                      </Button>
                    </Box>
                  )}

                  {/* Conteúdo da O.S */}
                  <VStack align="start" spacing={2}>
                    <Text fontWeight="bold">Empresa: {os.empresa}</Text>
                    <Text>Tipo: {os.Tipo_OS}</Text>
                    <Text>Cliente: {os.Nome_Cliente}</Text>
                    <Text>Endereço: {os.Endereco_Cliente}</Text>
                    <Text>
                      {os.Status_OS === 'Finalizado'
                        ? `Data de Finalização: ${new Date(os.Data_Entrega_OS).toLocaleString('pt-BR')}`
                        : `Data de Envio: ${new Date(os.Data_Envio_OS).toLocaleString('pt-BR')}`}
                    </Text>

                    {/* NOVO FLEX AGRUPANDO BADGES */}
                    <Flex align="center" gap={2} mt={2} mb={1} flexWrap="wrap">
                      <Badge
                        colorScheme={
                          os.Status_OS === 'Pendente' ? 'yellow'
                          : os.Status_OS === 'Finalizado' ? 'green'
                          : os.Status_OS === 'Execução' ? 'blue'
                          : os.Status_OS === 'Atribuido' ? 'purple'
                          : os.Status_OS === 'Improdutivo' ? 'red'
                          : os.Status_OS === 'Agendada' ? 'pink'
                          : os.Status_OS === 'Cancelado' ? 'pink'
                          : 'gray'
                        }
                      >
                        {os.Status_OS}
                      </Badge>

                      <Badge
                        colorScheme={
                          os.TipoCliente === 'Empresarial' ? 'blue'
                          : os.TipoCliente === 'Residencial' ? 'green'
                          : 'gray'
                        }
                        fontSize="0.7em"
                        p={1}
                        rounded="md"
                      >
                        {os.TipoCliente || 'Tipo não informado'}
                      </Badge>
                    </Flex>



                    
                  </VStack>
                </Box>
              )
            })}
          </VStack>

        )}

        



        
        <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
        <ModalOverlay />



        <ModalContent
                borderRadius="2xl"
                bg="gray.50"
                maxH="90vh" // limite de altura do modal
                overflow="hidden" // evita que o modal inteiro "vaze"
                >
                <ModalHeader
                    fontSize="xl"
                    fontWeight="bold"
                    textAlign="center"
                    borderBottom="1px solid #E2E8F0"
                    pb={2}
                >
                    📝 Ordem de Serviço
                </ModalHeader>
            <ModalCloseButton />

            <ModalBody
                mt={4}
                overflowY="auto"
                maxH="65vh" // o conteúdo interno poderá rolar se passar disso
                px={4}
            >
                {isMobile && (
                <Box mb={4} display="flex" justifyContent="flex-end">
                    <Button
                    size="sm"
                    colorScheme="purple"
                    onClick={() => {
                        onOpenObservacao()
                        onClose() // opcional: fecha o modal atual pra focar no de observação
                    }}
                    >
                    Adicionar Observação
                    </Button>
                </Box>
                )}


            <Text fontSize="sm" color="gray.500" mb={2}>Técnico Responsável</Text>
            <Text fontWeight="semibold" mb={4}>{ordemSelecionada?.Tecnico_Responsavel}</Text>

            <Select
                mb={4}
                value={mostrarDetalhes ? 'ver' : 'ocultar'}
                onChange={() => setMostrarDetalhes(!mostrarDetalhes)}
            >
                <option value="ver">Ver detalhes completos</option>
                <option value="ocultar">Ocultar detalhes</option>
            </Select>

            {mostrarDetalhes && (
                <Box mt={2} bg="gray.100" p={4} borderRadius="md">
                <Text><strong>Nº da O.S.:</strong> {ordemSelecionada?.Numero_OS}</Text>

                <Box display="flex" alignItems="center" gap={2}>
                    <Text><strong>Telefone 1:</strong> {ordemSelecionada?.Telefone1_Cliente}</Text>
                    <Button size="xs" onClick={() => navigator.clipboard.writeText(ordemSelecionada?.Telefone1_Cliente)}>Copiar</Button>
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                    <Text><strong>Telefone 2:</strong> {ordemSelecionada?.Telefone2_Cliente}</Text>
                    <Button size="xs" onClick={() => navigator.clipboard.writeText(ordemSelecionada?.Telefone2_Cliente)}>Copiar</Button>
                </Box>

                <Text><strong>Endereço:</strong> {ordemSelecionada?.Endereco_Cliente}</Text>
                <Text><strong>Obs. Empresa:</strong> {ordemSelecionada?.Observacao_Empresa}</Text>
                <Text><strong>Data de Envio:</strong> {new Date(ordemSelecionada?.Data_Envio_OS).toLocaleString('pt-BR')}</Text>
                <Text>
                    <strong>Geolocalização:</strong>{' '}
                    <a
                    href={`https://www.google.com/maps?q=${ordemSelecionada?.Geolocalizacao?.latitude},${ordemSelecionada?.Geolocalizacao?.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'blue' }}
                    >
                    Ver no Mapa
                    </a>
                </Text>
                </Box>
            )}

            <Box mt={6}>
              <Text fontSize="sm" color="gray.500" mb={1}>Tipo</Text>
              <Flex justify="space-between" align="center">
                <Text fontSize="lg" fontWeight="bold">{ordemSelecionada?.Tipo_OS}</Text>
                {ordemSelecionada?.Link_Ordem_PDF && (
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    as="a"
                    href={ordemSelecionada.Link_Ordem_PDF}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Baixar Ordem
                  </Button>
                )}

              </Flex>
            </Box>


            <Box mt={4}>
                <Text fontSize="sm" color="gray.500">Cliente</Text>
                <Text fontSize="lg" fontWeight="bold">{ordemSelecionada?.Nome_Cliente}</Text>
            </Box>

            <Box mb={4}>
                <Text fontSize="sm" color="gray.600" mb={1}>Andamento Técnico:</Text>

        <Box
            bg="gray.50"
            p={2}
            borderRadius="md"
            maxHeight="150px"  // 🔁 Altura máxima
            overflowY="auto"   // 🔁 Habilita scroll
            border="1px solid #E2E8F0"
        >
            {ordemSelecionada?.Andamento_técnico &&
            Object.values(ordemSelecionada.Andamento_técnico).map((msg, index) => (
                <Box
                key={index}
                bg="gray.100"
                p={3}
                borderRadius="md"
                mb={2}
                fontSize="sm"
                fontFamily="mono"
                whiteSpace="pre-wrap"
                >
                {msg}
                </Box>
            ))}
        </Box>
        </Box>



            <Box mt={4}>
                <Text fontSize="sm" color="gray.600" mb={1}>Status:</Text>
                <Select
                value={novoStatus}
                onChange={(e) => setNovoStatus(e.target.value)}
                bg="white"
                borderColor="gray.300"
                borderRadius="lg"
                >
                <option value="Em Aberto">Em Aberto</option>
                <option value="Atribuido">Atribuído</option>
                <option value="Enviado">Enviado</option>
                <option value="Execução">Execução</option>
                <option value="Pendente">Pendente</option>
                <option value="Improdutivo">Improdutivo</option>
                <option value="Cancelado">Cancelado</option>
                <option value="Finalizado">Finalizado</option>
                </Select>
            </Box>

            {['Cancelado', 'Improdutivo'].includes(novoStatus) && (
              <Box mt={4}>
                <Text fontSize="sm" color="gray.600" mb={1}>Justificativa:</Text>
                <Textarea
                  placeholder="Descreva a justificativa para o status selecionado..."
                  value={novaObservacao}
                  onChange={(e) => setNovaObservacao(e.target.value)}
                  isRequired
                  h="150px" // Altura fixa da Textarea
                  resize="none" // Impede que o usuário aumente com o mouse
                />
              </Box>
            )}


            <Box display="flex" justifyContent="space-between" alignItems="center" mt={6}>
                <Box>
                <Text fontSize="sm" color="gray.500">Última atualização</Text>
                <Text fontWeight="medium">
                    {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                </Box>
                <Badge
                px={3}
                py={1}
                borderRadius="lg"
                fontWeight="bold"
                colorScheme={
                    novoStatus === 'Finalizado'
                    ? 'green'
                    : novoStatus === 'Execução'
                    ? 'blue'
                    : novoStatus === 'Pendente'
                    ? 'yellow'
                    : 'gray'
                }
                >
                {novoStatus.toUpperCase()}
                </Badge>
            </Box>
            </ModalBody>

            <ModalFooter gap={2}>
            <Button colorScheme="blue" onClick={salvarAlteracaoNoBanco}>
                Salvar
            </Button>
            <Button variant="ghost" onClick={onClose}>
                Cancelar
            </Button>
            </ModalFooter>
        </ModalContent>
        </Modal>

        <Modal isOpen={isOpenObservacao} onClose={onCloseObservacao} isCentered>
        <ModalOverlay />

        <ModalContent
            maxW="400px"
            maxH="80vh" // Limita a altura do modal
            overflowY="auto" // Ativa rolagem se passar
          >
            <ModalHeader>Nova Observação</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Textarea
                placeholder="Escreva a nova observação..."
                value={novaObservacao}
                onChange={(e) => {
                  if (e.target.value.length <= 300) {
                    setNovaObservacao(e.target.value)
                  }
                }}
                maxLength={300}
                h="150px" // Altura fixa da Textarea
                resize="none" // Impede que o usuário aumente com o mouse
              />
              <Box mt={2} textAlign="right" fontSize="sm" color="gray.500">
                {novaObservacao.length}/300 caracteres
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="purple" mr={3} onClick={salvarNovaObservacao}>
                Salvar
              </Button>
              <Button variant="ghost" onClick={onCloseObservacao}>
                Cancelar
              </Button>
            </ModalFooter>
          </ModalContent>




        </Modal>




      </Box>
    </Box>
  )
}

export default OrdensEmAberto
