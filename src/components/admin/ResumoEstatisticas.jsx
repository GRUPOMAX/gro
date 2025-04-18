import { useEffect, useState } from 'react'
import {
  Box,
  Flex,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  useBreakpointValue,
  Spinner,
  useColorModeValue,
  useTheme,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '../../services/api'
import CountUp from 'react-countup'
import { PieChart } from 'react-minimal-pie-chart'

function ResumoEstatisticas() {
  const [dados, setDados] = useState({
    totalOS: 0,
    osExecucao: 0,
    osPendentes: 0,
    osFinalizadas: 0,
    totalEmpresas: 0,
    totalAdmins: 0,
  })
  const [loading, setLoading] = useState(true)
  const isMobile = useBreakpointValue({ base: true, md: false })
  const navigate = useNavigate()

  useEffect(() => {
    async function buscarDados() {
      try {
        const resOrdens = await apiGet(
          '/api/v2/tables/mtnh21kq153to8h/records?limit=1'
        )
        const registro = resOrdens.list?.[0] || {}
        let ordens = []

        if (registro['Ordem de Serviços']) {
          const jsonOrdem =
            typeof registro['Ordem de Serviços'] === 'string'
              ? JSON.parse(registro['Ordem de Serviços'])
              : registro['Ordem de Serviços']

          const empresas = jsonOrdem.empresas || []
          ordens = empresas.flatMap(emp => emp.Ordens_de_Servico || [])
        }

        const agora = new Date()
        const mesAtual = agora.getMonth()
        const anoAtual = agora.getFullYear()

        const ordensMesAtual = ordens.filter(os => {
          if (!os.Data_Envio_OS) return false
          const data = new Date(os.Data_Envio_OS)
          return (
            data.getMonth() === mesAtual &&
            data.getFullYear() === anoAtual
          )
        })

        const totalOS = ordensMesAtual.length
        const osExecucao = ordensMesAtual.filter(
          os => os.Status_OS === 'Execução'
        ).length
        const osPendentes = ordensMesAtual.filter(
          os =>
            os.Status_OS === 'Pendente' ||
            os.Status_OS === 'Pendenciada'
        ).length
        const osFinalizadas = ordensMesAtual.filter(
          os => os.Status_OS === 'Finalizado'
        ).length

        const todosRegistros = await apiGet(
          '/api/v2/tables/mga2sghx95o3ssp/records?limit=1000'
        )
        const totalEmpresas = todosRegistros.list.filter(
          item => item.tipo === 'empresa'
        ).length
        const totalAdmins = todosRegistros.list.filter(
          item => item.tipo === 'admin'
        ).length

        setDados({
          totalOS,
          osExecucao,
          osPendentes,
          osFinalizadas,
          totalEmpresas,
          totalAdmins,
        })
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error)
      } finally {
        setLoading(false)
      }
    }

    buscarDados()
    const interval = setInterval(buscarDados, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="100px">
        <Spinner size="lg" />
      </Flex>
    )
  }

  return (
    <SimpleGrid columns={isMobile ? 2 : 3} spacing={6} w="full">
      <StatCard
        label="Total O.S."
        value={dados.totalOS}
        total={dados.totalOS}
        onClick={() => navigate('/admin/todas-ordens')}
        colorScheme="blue"
      />
      <StatCard
        label="Em Execução"
        value={dados.osExecucao}
        total={dados.totalOS}
        onClick={() => navigate('/admin/ordens-andamento')}
        colorScheme="green"
      />
      <StatCard
        label="Pendentes"
        value={dados.osPendentes}
        total={dados.totalOS}
        onClick={() => navigate('/admin/ordens-pendenciadas')}
        colorScheme="yellow"
      />
      <StatCard
        label="Finalizadas"
        value={dados.osFinalizadas}
        total={dados.totalOS}
        onClick={() => navigate('/admin/ordens-finalizadas')}
        colorScheme="teal"
      />
      <StatCard
        label="Empresas"
        value={dados.totalEmpresas}
        total={dados.totalEmpresas}
        onClick={() => navigate('/admin/empresas')}
        colorScheme="purple"
      />
      <StatCard
        label="Admins"
        value={dados.totalAdmins}
        total={dados.totalAdmins}
        colorScheme="pink"
      />
    </SimpleGrid>
  )
}

function StatCard({ label, value, total, onClick, colorScheme }) {
  const theme = useTheme()
  const bgCard = useColorModeValue('white', 'gray.800')
  const hoverBg = useColorModeValue('gray.100', 'gray.700')
  const borderClr = useColorModeValue('gray.200', 'gray.600')
  const labelClr = useColorModeValue('gray.600', 'gray.300')
  const numberClr = useColorModeValue('gray.800', 'gray.100')
  const emptySliceClr = useColorModeValue(
    theme.colors.gray[200],
    theme.colors.gray[600]
  )

  const percentage = total > 0 ? (value / total) * 100 : 0
  const filledColor = useColorModeValue(
    theme.colors[colorScheme][400],
    theme.colors[colorScheme][300]
  )

  return (
    <Box
      p={4}
      borderWidth="1px"
      borderColor={borderClr}
      borderRadius="2xl"
      bg={bgCard}
      _hover={{
        cursor: onClick ? 'pointer' : 'default',
        bg: hoverBg,
      }}
      onClick={onClick}
    >
      <Stat>
        <StatLabel color={labelClr}>{label}</StatLabel>
        <Flex align="center" justify="space-between" mt={2}>
          <StatNumber color={numberClr} fontSize="xl">
            <CountUp end={value} duration={1.5} separator="," />
          </StatNumber>
          {total > 0 && (
            <Box w="50px" h="50px">
              <PieChart
                data={[
                  { title: 'Preenchido', value: percentage, color: filledColor },
                  { title: 'Restante',   value: 100 - percentage, color: emptySliceClr },
                ]}
                totalValue={100}
                lineWidth={30}
                rounded
                animate
                label={() => `${Math.round(percentage)}%`}
                labelStyle={{
                  fontSize: '5px',
                  fill: useColorModeValue(
                    theme.colors.gray[700],
                    theme.colors.gray[300]
                  ),
                }}
              />
            </Box>
          )}
        </Flex>
      </Stat>
    </Box>
  )
}

export default ResumoEstatisticas
