import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Box,
  Heading,
  Text,
  Spinner,
  useBreakpointValue,
  SimpleGrid,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Input,
  Flex,
  useColorModeValue,
  VStack
} from '@chakra-ui/react'



import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import AdminSidebarDesktop from '../../components/admin/AdminSidebarDesktop'
import AdminBottomNav from '../../components/admin/AdminBottomNav'
import AdminMobileMenu from '../../components/admin/AdminMobileMenu'
import { apiGet } from '../../services/api'


import DatePicker, { registerLocale } from 'react-datepicker'
import ptBR from 'date-fns/locale/pt-BR'
import 'react-datepicker/dist/react-datepicker.css'

registerLocale('pt-BR', ptBR)
import { format } from 'date-fns'

function PaginaMetricaTecnico() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [metricas, setMetricas] = useState(null)
  const [nomeTecnico, setNomeTecnico] = useState('')
  const [loading, setLoading] = useState(true)
  const isMobile = useBreakpointValue({ base: true, md: false })
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [ordemExecucao, setOrdemExecucao] = useState(null)



    // cores adaptáveis
    const pageBg        = useColorModeValue('gray.50',   'gray.800')
    const cardBg        = useColorModeValue('white',     'gray.700')
    const cardBorder    = useColorModeValue('gray.200',  'gray.600')
    const hoverBg       = useColorModeValue('gray.100',  'gray.600')
    const textColor     = useColorModeValue('gray.700',  'gray.300')
    const headingColor  = useColorModeValue('gray.900',  'gray.50')
    const accentGreenBg = useColorModeValue('green.50',   'green.900')
    const accentRedBg   = useColorModeValue('red.50',     'red.900')
    const statBg        = useColorModeValue('gray.100',  'gray.600')
    const inputBg       = useColorModeValue('white',     'gray.600')
    const inputBorder   = useColorModeValue('gray.300',  'gray.500')
    const axisColor     = useColorModeValue('gray.600',  'gray.400')


useEffect(() => {
    const fetchMetricas = async () => {
      try {
        const tecnicosRes = await apiGet('/api/v2/tables/mpyestriqe5a1kc/records')
        const tecnico = tecnicosRes.list.find(t => t.ID_Tecnico_Responsavel === id)
        setNomeTecnico(tecnico?.Tecnico_Responsavel || 'Desconhecido')
  
        const ordensRes = await apiGet('/api/v2/tables/mtnh21kq153to8h/records')
        const todasOrdens = ordensRes.list.flatMap(item => {
          const json = typeof item['Ordem de Serviços'] === 'string'
            ? JSON.parse(item['Ordem de Serviços'])
            : item['Ordem de Serviços']
  
          return json.empresas.flatMap(emp =>
            emp.Ordens_de_Servico.filter(os => os.ID_Tecnico_Responsavel === id).map(os => ({
              ...os,
              empresa: emp.empresa
            }))
          )
        })
  
        const ordemExecucao = todasOrdens.find(os => os.Status_OS === 'Execução')
        setOrdemExecucao(ordemExecucao || null)
        
  
        // 🟦 Função de filtro por data
        const dentroDoPeriodo = (dataStr) => {
            if (!dataInicio) return true;
            
            const inicio = new Date(dataInicio)
            inicio.setHours(0, 0, 0, 0)
          
            const fim = dataFim ? new Date(dataFim) : new Date()
            fim.setHours(23, 59, 59, 999)
          
            const data = new Date(dataStr)
            return data >= inicio && data <= fim
          }
          
          
  
        const atribuidas = todasOrdens.filter(os => os.Status_OS === 'Atribuido' && dentroDoPeriodo(os.Data_Entrega_OS))
        const finalizadas = todasOrdens.filter(os => os.Status_OS === 'Finalizado' && dentroDoPeriodo(os.Data_Entrega_OS))
        const pendentes = todasOrdens.filter(os => os.Status_OS === 'Pendente' && dentroDoPeriodo(os.Data_Entrega_OS))
        const reagendadas = todasOrdens.filter(os => os.Status_OS === 'Reagendada' && dentroDoPeriodo(os.Data_Entrega_OS))
  
        const finalizadasMes = finalizadas
  
        const tempos = finalizadas
          .filter(os => os.Data_Envio_OS && os.Data_Entrega_OS)
          .map(os => {
            const envio = new Date(os.Data_Envio_OS).getTime()
            const entrega = new Date(os.Data_Entrega_OS).getTime()
            const tempoHoras = (entrega - envio) / (1000 * 60 * 60)
            return { tempo: tempoHoras, os }
          })
  
        const maisRapida = tempos.reduce((a, b) => a.tempo < b.tempo ? a : b, tempos[0])
        const maisLenta = tempos.reduce((a, b) => a.tempo > b.tempo ? a : b, tempos[0])
  
        setMetricas({
          totalFinalizadas: finalizadasMes.length,
          pendentes: pendentes.length,
          reagendadas: reagendadas.length,
          atribuidas: atribuidas.length,
          maisRapida: maisRapida?.os,
          maisLenta: maisLenta?.os
        })
  
      } catch (err) {
        console.error('Erro ao buscar métricas:', err)
      } finally {
        setLoading(false)
      }
    }
  
    fetchMetricas()

    const interval = setInterval(fetchMetricas, 1000) // 10 segundos
    return () => clearInterval(interval)

  }, [id, dataInicio, dataFim])
  

  if (loading) return <Spinner size="xl" />

  return (
    <Box display="flex" bg={pageBg} color={textColor} minH="100vh">
      {!isMobile && <AdminSidebarDesktop />}
      {isMobile && <AdminMobileMenu />}

      <Box ml={!isMobile ? '250px' : 0} w="full" p={6} pb={isMobile ? '60px' : 0}>
        {isMobile && <AdminBottomNav />}

        <Button size="sm" variant="outline" mb={4} onClick={() => navigate('/admin/tecnicos')}>
          ← Voltar
        </Button>

        {ordemExecucao && (
          isMobile ? (
            <Accordion allowToggle mb={4} bg={accentGreenBg} borderRadius="md" border={`1px solid ${cardBorder}`}>
              <AccordionItem border="none">
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color={headingColor}>
                    🔧 Ordem em Execução
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <Text><strong>Cliente:</strong> {ordemExecucao.Nome_Cliente}</Text>
                  <Text><strong>Telefone:</strong> {ordemExecucao.Telefone1_Cliente}</Text>
                  <Text><strong>Tipo:</strong> {ordemExecucao.Tipo_OS}</Text>
                  <Text><strong>Endereço:</strong> {ordemExecucao.Endereco_Cliente}</Text>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          ) : (
              <Box
                position="absolute"
                top={6}
                right={6}
                bg={accentGreenBg}
                p={4}
                w="380px"
                borderRadius="md"
                border="1px solid green.400"
                boxShadow="lg"
                wordBreak="break-word"        // força quebra de palavra
                overflowWrap="break-word"     // garante que o texto se adapte
              >
                <Heading size="sm" mb={2} color={headingColor} noOfLines={1}>
                  🔧 Ordem em Execução
                </Heading>
                <VStack align="start" spacing={1} textAlign="left">
                  <Text fontSize="sm" whiteSpace="normal" wordBreak="break-word">
                    <strong>Cliente:</strong> {ordemExecucao.Nome_Cliente}
                  </Text>
                  <Text fontSize="sm" whiteSpace="normal" wordBreak="break-word">
                    <strong>Telefone:</strong> {ordemExecucao.Telefone1_Cliente}
                  </Text>
                  <Text fontSize="sm" whiteSpace="normal" wordBreak="break-word">
                    <strong>Tipo:</strong> {ordemExecucao.Tipo_OS}
                  </Text>
                  <Text fontSize="sm" whiteSpace="normal" wordBreak="break-word">
                    <strong>Endereço:</strong> {ordemExecucao.Endereco_Cliente}
                  </Text>
                </VStack>
              </Box>

          )
        )}

        <Heading size="lg" mb={4} color={headingColor}>Métricas do Técnico</Heading>
        <Text fontWeight="bold" mb={6}>{nomeTecnico}</Text>

        {/* Filtros de Data */}
        <Flex gap={4} mb={6} direction={{ base: 'column', md: 'row' }}>
          <Box>
            <Text mb={1}>Data Início</Text>
            <DatePicker
              selected={dataInicio}
              onChange={setDataInicio}
              locale="pt-BR"
              dateFormat="dd/MM/yyyy"
              customInput={<Input bg={inputBg} borderColor={inputBorder} />}
            />
          </Box>
          <Box>
            <Text mb={1}>Data Fim</Text>
            <DatePicker
              selected={dataFim}
              onChange={setDataFim}
              locale="pt-BR"
              dateFormat="dd/MM/yyyy"
              customInput={<Input bg={inputBg} borderColor={inputBorder} />}
            />
          </Box>
        </Flex>

        {/* Estatísticas */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
          <Stat p={4} bg={statBg} borderRadius="md" border={`1px solid ${cardBorder}`}>
            <StatLabel>Finalizadas no Mês</StatLabel>
            <StatNumber>{metricas.totalFinalizadas}</StatNumber>
          </Stat>
          <Stat p={4} bg={statBg} borderRadius="md" border={`1px solid ${cardBorder}`}>
            <StatLabel>Pendentes</StatLabel>
            <StatNumber>{metricas.pendentes}</StatNumber>
          </Stat>
          <Stat p={4} bg={statBg} borderRadius="md" border={`1px solid ${cardBorder}`}>
            <StatLabel>Reagendadas</StatLabel>
            <StatNumber>{metricas.reagendadas}</StatNumber>
          </Stat>
          <Stat p={4} bg={statBg} borderRadius="md" border={`1px solid ${cardBorder}`}>
            <StatLabel>Atribuídas</StatLabel>
            <StatNumber>{metricas.atribuidas}</StatNumber>
          </Stat>
        </SimpleGrid>

        {/* Mais Rápida / Mais Lenta */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
          <Box p={4} bg={accentGreenBg} borderRadius="md" border={`1px solid green.400`}>
            <Heading size="sm" mb={2}>Mais Rápida</Heading>
            <Text fontSize="sm"><strong>Cliente:</strong> {metricas.maisRapida?.Nome_Cliente}</Text>
            <Text fontSize="sm">
              <strong>Tempo:</strong>{' '}
              {metricas.maisRapida?.Data_Entrega_OS
                ? `${(((new Date(metricas.maisRapida.Data_Entrega_OS) - new Date(metricas.maisRapida.Data_Envio_OS)) / 3600000).toFixed(2))}h`
                : 'N/A'}
            </Text>
          </Box>
          <Box p={4} bg={accentRedBg} borderRadius="md" border={`1px solid red.400`}>
            <Heading size="sm" mb={2}>Mais Lenta</Heading>
            <Text fontSize="sm"><strong>Cliente:</strong> {metricas.maisLenta?.Nome_Cliente}</Text>
            <Text fontSize="sm">
              <strong>Tempo:</strong>{' '}
              {metricas.maisLenta?.Data_Entrega_OS
                ? `${(((new Date(metricas.maisLenta.Data_Entrega_OS) - new Date(metricas.maisLenta.Data_Envio_OS)) / 3600000).toFixed(2))}h`
                : 'N/A'}
            </Text>
          </Box>
        </SimpleGrid>

        {/* Gráfico */}
        <Heading size="sm" mb={2} color={headingColor}>Gráfico de Atividades</Heading>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { name: 'Finalizadas', valor: metricas.totalFinalizadas },
            { name: 'Pendentes',   valor: metricas.pendentes },
            { name: 'Reagendadas', valor: metricas.reagendadas }
          ]}>
            <XAxis dataKey="name" stroke={axisColor}/>
            <YAxis stroke={axisColor}/>
            <Tooltip/>
            <Bar dataKey="valor" fill="#805AD5" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}

export default PaginaMetricaTecnico
