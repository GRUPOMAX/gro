import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '../../services/api'
import {
  Box, Heading, Text, Button, Flex, Spinner, useBreakpointValue, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter
} from '@chakra-ui/react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

import AdminSidebarDesktop from '../../components/admin/AdminSidebarDesktop'
import AdminBottomNav from '../../components/admin/AdminBottomNav'
import AdminMobileMenu from '../../components/admin/AdminMobileMenu'
import { useDisclosure } from '@chakra-ui/react'

function EmpresaDashboard() {
  const [empresa, setEmpresa] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const [metricasOS, setMetricasOS] = useState({ abertas: 0, execucao: 0, agendadas: 0, canceladas: 0, pendenciadas: 0, finalizadas: 0, improdutivas: 0 })
  const [timelinePendenciadas, setTimelinePendenciadas] = useState([])
  const [timelineFinalizadas, setTimelineFinalizadas] = useState([])
  const [timelineCanceladas, setTimelineCanceladas] = useState([])
  const [mostrarImprodutivas, setMostrarImprodutivas] = useState(true)

  const { isOpen, onOpen, onClose } = useDisclosure()
  const restante = empresa?.restanteOSMes ?? 0

  const restanteColor = restante === 0 ? 'red.100' : restante <= 3 ? 'yellow.100' : 'green.100'
  const restanteTextColor = restante === 0 ? 'red.800' : restante <= 3 ? 'yellow.800' : 'green.800'
  const pulseClass = restante <= 3 ? 'pulse-animation' : ''

  const isMobile = useBreakpointValue({ base: true, md: false })

  const handleClick = () => {
    if (restante <= 0) onOpen()
    else navigate('/empresa/abrir-ordem')
  }

  useEffect(() => {
    const fetchEmpresa = async () => {
      const empresaId = localStorage.getItem('empresa_id')
      const unicID = localStorage.getItem('UnicID')
      if (!empresaId) { setLoading(false); return }

      try {
        const agora = new Date()
        const empresaRes = await apiGet(`/api/v2/tables/mga2sghx95o3ssp/records/${empresaId}`)
        const ordensRes = await apiGet('/api/v2/tables/mtnh21kq153to8h/records')

        const todasOrdens = ordensRes.list.flatMap(item => {
          const json = typeof item['Ordem de Serviços'] === 'string' ? JSON.parse(item['Ordem de Serviços']) : item['Ordem de Serviços']
          return json.empresas.flatMap(emp => emp.Ordens_de_Servico.map(os => ({ ...os, empresa: emp.empresa, UnicID_Empresa: emp.UnicID_Empresa })))
        })

        const minhasOrdens = todasOrdens.filter(os => os.UnicID_Empresa === unicID)
        const mesAtual = agora.toISOString().slice(0, 7)
        const ordensDoMes = minhasOrdens.filter(o => new Date(o.Data_Envio_OS).toISOString().slice(0,7) === mesAtual)

        const usadas = ordensDoMes.length
        const limite = empresaRes.Limite_de_Ordem || 0
        const restante = Math.max(limite - usadas, 0)

        setEmpresa({ ...empresaRes, usadasOSMes: usadas, restanteOSMes: restante })

        const metricas = {
          abertas: minhasOrdens.filter(o => ['Em Aberto', 'Agendada', 'Reagendada', 'Pendente', 'Atribuído', 'Enviado'].includes(o.Status_OS)).length,
          agendadas: minhasOrdens.filter(o => o.Status_OS === 'Agendada').length,
          execucao: minhasOrdens.filter(o => o.Status_OS === 'Execução').length,
          canceladas: minhasOrdens.filter(o => o.Status_OS === 'Cancelado').length,
          pendenciadas: minhasOrdens.filter(o => ['pendente', 'pendenciada'].includes(o.Status_OS?.toLowerCase())).length,
          finalizadas: minhasOrdens.filter(o => o.Status_OS === 'Finalizado').length,
          improdutivas: minhasOrdens.filter(o => ['improdutivo', 'improdutivos'].includes(o.Status_OS?.toLowerCase())).length,
        }

        setMetricasOS(metricas)

        const horaAtual = agora.toLocaleTimeString()
        setTimelinePendenciadas(prev => [...prev.slice(-9), { hora: horaAtual, valor: metricas.pendenciadas }])
        setTimelineFinalizadas(prev => [...prev.slice(-9), { hora: horaAtual, valor: metricas.finalizadas }])
        setTimelineCanceladas(prev => [...prev.slice(-9), { hora: horaAtual, valor: metricas.canceladas }])
      } catch (err) {
        console.error('Erro ao buscar dados:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEmpresa()
    const interval = setInterval(fetchEmpresa, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setMostrarImprodutivas(prev => !prev), 8000)
    return () => clearInterval(interval)
  }, [])

  const ultimoCard = useMemo(() => (mostrarImprodutivas && metricasOS.improdutivas > 0) ?
    { bg: 'gray.200', label: 'Improdutivas', valor: metricasOS.improdutivas, rota: '/empresa/ordens-improdutivas' } :
    { bg: 'red.50', label: 'Canceladas', valor: metricasOS.canceladas, rota: '/empresa/ordens-canceladas' },
    [mostrarImprodutivas, metricasOS]
  )

  const cardsOS = useMemo(() => [
    { bg: 'blue.50', label: 'Em Aberto', valor: metricasOS.abertas, rota: '/empresa/ordens-abertas' },
    { bg: 'cyan.50', label: 'Agendadas', valor: metricasOS.agendadas, rota: '/empresa/ordens-agendadas' },
    { bg: 'orange.50', label: 'Em Execução', valor: metricasOS.execucao, rota: '/empresa/ordens-andamento' },
    { bg: 'green.50', label: 'Finalizadas', valor: metricasOS.finalizadas, rota: '/empresa/ordens-finalizadas' },
    { bg: 'purple.50', label: 'Pendenciadas', valor: metricasOS.pendenciadas, rota: '/empresa/ordens-pendenciadas' },
    ultimoCard
  ], [ultimoCard, metricasOS])

  if (loading) return <Spinner size="xl" mt={20} />
  if (!empresa) return <Text>Empresa não encontrada.</Text>

  return (
    <Box display="flex">
      {!isMobile && <AdminSidebarDesktop />}
      {isMobile && <AdminMobileMenu />}
      {isMobile && <AdminBottomNav />}

      <Box ml={!isMobile ? '250px' : 0} p={6} minH="100vh" pb={isMobile ? '100px' : '0'} w="100%">
        <Box maxW="1200px" mx="auto">

          <Heading size="lg" mb={4}>Bem-vindo, {empresa?.empresa_nome}</Heading>

          <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
          <Text fontSize="xl">Suas Ordens de Serviço</Text>

          <Flex
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'stretch', md: 'center' }}
            justify={{ base: 'center', md: 'flex-end' }}
            gap={3}
            w={{ base: '100%', md: 'auto' }}
          >
            <Flex gap={3} w="100%" justify="center">
              <Box bg="gray.100" px={4} py={2} borderRadius="lg" textAlign="center" flex="1">
                <Text fontSize="sm" fontWeight="bold" color="gray.600">Limite de O.S.</Text>
                <Text fontSize="lg" fontWeight="bold" color="blue.600">{empresa?.Limite_de_Ordem ?? 0}</Text>
              </Box>

              <Box className={pulseClass} bg={restanteColor} px={4} py={2} borderRadius="lg" textAlign="center" flex="1">
                <Text fontSize="sm" fontWeight="bold" color={restanteTextColor}>Restantes</Text>
                <Text fontSize="lg" fontWeight="bold" color={restanteTextColor}>{empresa?.restanteOSMes ?? 0}</Text>
              </Box>
            </Flex>

            <Button
                colorScheme="blue"
                onClick={handleClick}
                w={{ base: '100%', md: 'auto' }}
                px={6} // padding horizontal
                py={3} // padding vertical
              >
                Criar nova O.S.
              </Button>
          </Flex>
        </Flex>


          <Flex gap={4} wrap="wrap" mb={8}>
            {cardsOS.map((card, i) => (
              <Box key={i} bg={card.bg} p={4} borderRadius="lg" flex="1" minW="150px" cursor="pointer" _hover={{ bg: `${card.bg.replace('.50', '.100')}`, transform: 'translateY(-3px)', boxShadow: 'lg' }} onClick={() => navigate(card.rota)}>
                <Text fontWeight="bold">{card.label}</Text>
                <Text fontSize="2xl">{card.valor}</Text>
              </Box>
            ))}
          </Flex>

          {[{ title: 'Timeline - Ordens Finalizadas', data: timelineFinalizadas, color: '#38A169' },
            { title: 'Timeline - Ordens Pendenciadas', data: timelinePendenciadas, color: '#805AD5' },
            { title: 'Timeline - Ordens Canceladas', data: timelineCanceladas, color: '#E53E3E' }].map((grafico, idx) => (
            <Box key={idx} mt={10} p={4} bg="gray.50" borderRadius="lg" boxShadow="sm">
              <Heading size="md" mb={2}>{grafico.title}</Heading>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={grafico.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="valor" stroke={grafico.color} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          ))}

        </Box>
      </Box>
    </Box>
  )
}

export default EmpresaDashboard