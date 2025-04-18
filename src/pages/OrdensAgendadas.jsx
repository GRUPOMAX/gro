import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Badge,
  useToast,
  useBreakpointValue,
  Flex,
  Select,
  Input,
  Button as ButtonChakra,
  useDisclosure,
  Button,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react'
import { apiGet, apiPatch } from '../services/api'
import AdminSidebarDesktop from '../components/admin/AdminSidebarDesktop'
import AdminBottomNav from '../components/admin/AdminBottomNav'
import AdminMobileMenu from '../components/admin/AdminMobileMenu'

export default function OrdensAgendadas() {
  const [ordens, setOrdens] = useState([])
  const [loading, setLoading] = useState(true)
  const [tecnicos, setTecnicos] = useState([])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState(null)
  const [ordemSelecionada, setOrdemSelecionada] = useState(null)
  const [loadingSalvar, setLoadingSalvar] = useState(false)
  const toast = useToast()
  const isMobile = useBreakpointValue({ base: true, md: false })
  const navigate = useNavigate()
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')

  // cores adaptáveis
  const bgPage       = useColorModeValue('white',    'gray.800')
  const headingColor = useColorModeValue('gray.800', 'white')
  const textColor    = useColorModeValue('gray.700', 'gray.200')
  const cardBg       = useColorModeValue('white',    'gray.700')
  const borderClr    = useColorModeValue('gray.200', 'gray.600')
  const hoverBg      = useColorModeValue('gray.50',  'gray.600')
  const modalBg      = useColorModeValue('white',    'gray.700')
  const inputBg      = useColorModeValue('white',    'gray.600')
  const inputBorder  = useColorModeValue('gray.300', 'gray.500')

  const fetchOrdens = useCallback(async () => {
    try {
      const res = await apiGet('/api/v2/tables/mtnh21kq153to8h/records')
      const todas = res.list.flatMap(item => {
        const raw = item['Ordem de Serviços']
        if (!raw) return []
        const json = typeof raw === 'string' ? JSON.parse(raw) : raw
        return json.empresas?.flatMap(emp =>
          emp.Ordens_de_Servico.map(os => ({
            ...os,
            empresa: emp.empresa,
            registroId: item.Id
          }))
        ) || []
      })
      setOrdens(todas)
    } catch (err) {
      toast({ title:'Erro ao buscar ordens', status:'error', duration:3000 })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchTecnicos = useCallback(async () => {
    try {
      const res = await apiGet('/api/v2/tables/mpyestriqe5a1kc/records')
      setTecnicos(res.list || [])
    } catch {}
  }, [])

  useEffect(() => {
    fetchOrdens()
    fetchTecnicos()
  }, [fetchOrdens, fetchTecnicos])

  useEffect(() => {
    const iv = setInterval(fetchOrdens, 10000)
    return () => clearInterval(iv)
  }, [fetchOrdens])

  const abrirModalTrocarTecnico = ordem => {
    setOrdemSelecionada(ordem)
    setTecnicoSelecionado({
      id: ordem.ID_Tecnico_Responsavel,
      nome: ordem.Tecnico_Responsavel
    })
    onOpen()
  }

  const salvarNovoTecnico = async () => {
    if (!ordemSelecionada || !tecnicoSelecionado) return
    setLoadingSalvar(true)
    try {
      const res = await apiGet(
        `/api/v2/tables/mtnh21kq153to8h/records/${ordemSelecionada.registroId}`
      )
      const orig = typeof res['Ordem de Serviços']==='string'
        ? JSON.parse(res['Ordem de Serviços'])
        : res['Ordem de Serviços']
      const novo = {
        ...orig,
        empresas: orig.empresas.map(emp =>
          emp.UnicID_Empresa !== ordemSelecionada.UnicID_Empresa
            ? emp
            : {
                ...emp,
                Ordens_de_Servico: emp.Ordens_de_Servico.map(os =>
                  os.UnicID_OS === ordemSelecionada.UnicID_OS
                    ? {
                        ...os,
                        Tecnico_Responsavel: tecnicoSelecionado.nome,
                        ID_Tecnico_Responsavel: tecnicoSelecionado.id
                      }
                    : os
                )
              }
        )
      }
      await apiPatch('/api/v2/tables/mtnh21kq153to8h/records', {
        Id: ordemSelecionada.registroId,
        'Ordem de Serviços': JSON.stringify(novo)
      })
      toast({ title:'Técnico alterado!', status:'success', duration:3000 })
      onClose()
      fetchOrdens()
    } catch {
      toast({ title:'Erro ao salvar', status:'error', duration:3000 })
    } finally {
      setLoadingSalvar(false)
    }
  }

  return (
    <Box display="flex" bg={bgPage} color={textColor} minH="100vh">
      {!isMobile && <AdminSidebarDesktop />}
      {isMobile && <AdminMobileMenu />}

      <Box p={6} ml={!isMobile ? '250px' : 0} w="full" pb={isMobile ? '60px' : 0}>
        {isMobile && <AdminBottomNav />}

        <Heading size="lg" mb={4} color={headingColor}>
          Ordens Agendadas
        </Heading>

        {loading ? (
          <Spinner size="xl" />
        ) : (
          <>
            <Flex mb={4} gap={4} flexWrap="wrap">
              <Box>
                <Text fontSize="sm" mb={1}>Data Inicial</Text>
                <Input
                  type="date"
                  bg={inputBg}
                  borderColor={inputBorder}
                  value={dataInicial}
                  onChange={e => setDataInicial(e.target.value)}
                  maxW="200px"
                />
              </Box>
              <Box>
                <Text fontSize="sm" mb={1}>Data Final</Text>
                <Input
                  type="date"
                  bg={inputBg}
                  borderColor={inputBorder}
                  value={dataFinal}
                  onChange={e => setDataFinal(e.target.value)}
                  maxW="200px"
                />
              </Box>
            </Flex>

            <VStack align="stretch" spacing={4}>
              {ordens
                .filter(os => os.Status_OS === 'Agendada')
                .map(os => (
                  <Box
                    key={os.UnicID_OS}
                    p={4}
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={borderClr}
                    borderRadius="md"
                    _hover={{ bg: hoverBg, cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/ordem-execucao/${os.UnicID_OS}`)}
                  >
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="bold">{os.empresa}</Text>
                        <Flex mt={2} gap={2} flexWrap="wrap">
                          <Badge colorScheme="pink">AGENDADA</Badge>
                          <Badge
                            colorScheme={
                              os.TipoCliente === 'Empresarial' ? 'blue' :
                              os.TipoCliente === 'Residencial' ? 'green' :
                              'gray'
                            }
                          >
                            {os.TipoCliente}
                          </Badge>
                        </Flex>
                      </Box>
                      <ButtonChakra
                        size="sm"
                        colorScheme="blue"
                        onClick={e => {
                          e.stopPropagation()
                          abrirModalTrocarTecnico(os)
                        }}
                      >
                        Mudar Técnico
                      </ButtonChakra>
                    </Flex>
                    <Text mt={2}>Cliente: {os.Nome_Cliente}</Text>
                    <Text>Endereço: {os.Endereco_Cliente}</Text>
                    <Text fontSize="xs" color={useColorModeValue('gray.500','gray.400')}>
                      Enviado: {new Date(os.Data_Envio_OS).toLocaleString('pt-BR')}
                    </Text>
                  </Box>
                ))}
            </VStack>
          </>
        )}

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent bg={modalBg}>
            <ModalHeader>Mudar Técnico</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Select
                bg={inputBg}
                borderColor={inputBorder}
                placeholder="Selecione o técnico"
                value={tecnicoSelecionado?.id || ''}
                onChange={e => {
                  const t = tecnicos.find(t => t.ID_Tecnico_Responsavel === e.target.value)
                  setTecnicoSelecionado(t && { id: t.ID_Tecnico_Responsavel, nome: t.Tecnico_Responsavel })
                }}
              >
                {tecnicos.map(t => (
                  <option key={t.ID_Tecnico_Responsavel} value={t.ID_Tecnico_Responsavel}>
                    {t.Tecnico_Responsavel}
                  </option>
                ))}
              </Select>
            </ModalBody>
            <ModalFooter>
              <ButtonChakra variant="ghost" mr={3} onClick={onClose}>
                Cancelar
              </ButtonChakra>
              <ButtonChakra colorScheme="blue" onClick={salvarNovoTecnico} isLoading={loadingSalvar}>
                Salvar
              </ButtonChakra>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Box>
  )
}
