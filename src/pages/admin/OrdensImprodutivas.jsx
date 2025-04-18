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
  Flex,
  Input,
  useColorModeValue,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '../../services/api'
import AdminSidebarDesktop from '../../components/admin/AdminSidebarDesktop'
import AdminMobileMenu from '../../components/admin/AdminMobileMenu'
import AdminBottomNav from '../../components/admin/AdminBottomNav'

export default function OrdensImprodutivas() {
  const [ordens, setOrdens] = useState([])
  const [loading, setLoading] = useState(true)
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const isMobile = useBreakpointValue({ base: true, md: false })
  const navigate = useNavigate()
  const toast = useToast()

  // color‑mode tokens
  const pageBg      = useColorModeValue('gray.50',  'gray.800')
  const cardBg      = useColorModeValue('white',   'gray.700')
  const borderClr   = useColorModeValue('gray.200','gray.600')
  const hoverBg     = useColorModeValue('gray.100','gray.600')
  const inputBg     = useColorModeValue('white',   'gray.600')
  const inputBorder = useColorModeValue('gray.300','gray.500')
  const textColor   = useColorModeValue('gray.800','gray.100')

  useEffect(() => {
    async function fetchOrdens() {
      try {
        const res = await apiGet('/api/v2/tables/mtnh21kq153to8h/records')
        const items = res.list.flatMap(item => {
          const rawJson = item['Ordem de Serviços']
          if (!rawJson) return []
          const json = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson
          if (!json.empresas) return []
          return json.empresas.flatMap(empresa =>
            empresa.Ordens_de_Servico.map(os => ({
              ...os,
              empresa:      empresa.empresa,
              UnicID_Empresa: empresa.UnicID_Empresa,
            }))
          )
        })
        setOrdens(items)
      } catch (error) {
        toast({ title: 'Erro ao buscar ordens', status: 'error', duration: 3000 })
      } finally {
        setLoading(false)
      }
    }
    fetchOrdens()

    const hoje       = new Date()
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const ultimoDia   = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    setDataInicial(primeiroDia.toISOString().slice(0, 10))
    setDataFinal(ultimoDia.toISOString().slice(0, 10))
  }, [toast])

  const ordensFiltradas = ordens
    .filter(os => os.Status_OS === 'Improdutivo')
    .filter(os => {
      const dataEnvio = new Date(os.Data_Envio_OS)
      const inicio    = dataInicial ? new Date(`${dataInicial}T00:00:00`) : null
      const fim       = dataFinal   ? new Date(`${dataFinal}T23:59:59`) : null

      if (inicio && fim) return dataEnvio >= inicio && dataEnvio <= fim
      if (inicio)       return dataEnvio >= inicio
      if (fim)          return dataEnvio <= fim
      return true
    })

  return (
    <Box display="flex" bg={pageBg} color={textColor} minH="100vh">
      {!isMobile && <AdminSidebarDesktop />}
      {isMobile && <AdminMobileMenu />}
      <Box p={6} ml={!isMobile ? '250px' : 0} w="full" pb={isMobile ? '60px' : 0}>
        {isMobile && <AdminBottomNav />}

        <Heading size="lg" mb={4}>Ordens Improdutivas</Heading>

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

        {loading ? (
          <Spinner size="xl" />
        ) : (
          <VStack align="stretch" spacing={4}>
            {ordensFiltradas.length === 0 ? (
              <Text>Nenhuma ordem improdutiva encontrada.</Text>
            ) : (
              ordensFiltradas.map(os => (
                <Box
                  key={os.UnicID_OS}
                  p={4}
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderClr}
                  borderRadius="md"
                  _hover={{ bg: hoverBg, cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/ordens-improdutivas/${os.UnicID_OS}`)}
                >
                  <VStack align="start" spacing={2}>
                    <Text fontWeight="bold">Empresa: {os.empresa}</Text>
                    <Text>Cliente: {os.Nome_Cliente}</Text>
                    <Text>Endereço: {os.Endereco_Cliente}</Text>
                    <Text>Tipo: {os.Tipo_OS}</Text>
                    <Text fontSize="sm" color="gray.500">
                      Data de Envio: {new Date(os.Data_Envio_OS).toLocaleString('pt-BR')}
                    </Text>
                    <Badge colorScheme="red">{os.Status_OS}</Badge>
                  </VStack>
                </Box>
              ))
            )}
          </VStack>
        )}
      </Box>
    </Box>
  )
}
