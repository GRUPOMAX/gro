// src/pages/admin/OrdensFinalizadas.jsx

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Heading,
  Text,
  Spinner,
  VStack,
  Badge,
  Select,
  Flex,
  Input,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react'
import AdminSidebarDesktop from '../../components/admin/AdminSidebarDesktop'
import AdminBottomNav from '../../components/admin/AdminBottomNav'
import AdminMobileMenu from '../../components/admin/AdminMobileMenu'
import { apiGet } from '../../services/api'

export default function OrdensFinalizadas() {
  const [ordens, setOrdens] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [empresaSelecionada, setEmpresaSelecionada] = useState('')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const isMobile = useBreakpointValue({ base: true, md: false })

  // color‑mode tokens
  const pageBg      = useColorModeValue('gray.50',  'gray.800')
  const cardBg      = useColorModeValue('white',   'gray.700')
  const borderClr   = useColorModeValue('gray.200','gray.600')
  const hoverBg     = useColorModeValue('gray.50',  'gray.600')
  const inputBg     = useColorModeValue('white',   'gray.600')
  const inputBorder = useColorModeValue('gray.300','gray.500')
  const selectBg    = useColorModeValue('white',   'gray.600')
  const textColor   = useColorModeValue('gray.800','gray.100')

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiGet('/api/v2/tables/mtnh21kq153to8h/records')
        const todasOrdens = res.list.flatMap(item => {
          const json = typeof item['Ordem de Serviços'] === 'string'
            ? JSON.parse(item['Ordem de Serviços'])
            : item['Ordem de Serviços']

          return json.empresas.flatMap(emp =>
            emp.Ordens_de_Servico.map(os => ({
              ...os,
              empresa: emp.empresa,
              UnicID_Empresa: emp.UnicID_Empresa,
              registroId: item.Id
            }))
          )
        })

        setOrdens(todasOrdens)
        const listaEmpresas = [...new Set(todasOrdens.map(o => o.empresa))]
        setEmpresas(listaEmpresas)
      } catch (err) {
        console.error('Erro ao buscar ordens:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const ordensFiltradas = ordens
    .filter(o => o.Status_OS === 'Finalizado')
    .filter(o => empresaSelecionada ? o.empresa === empresaSelecionada : true)
    .filter(o => {
      const dataEnvio = new Date(o.Data_Envio_OS)
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

      <Box
        ml={!isMobile ? '250px' : 0}
        p={6}
        w="full"
        pb={isMobile ? '60px' : 0}
      >
        {isMobile && <AdminBottomNav />}

        <Heading size="lg" mb={6}>Ordens Finalizadas</Heading>

        {loading ? (
          <Spinner size="xl" />
        ) : (
          <>
            {/* filtros */}
            <Flex mb={6} gap={4} flexWrap="wrap">
              <Select
                placeholder="Filtrar por empresa"
                value={empresaSelecionada}
                onChange={e => setEmpresaSelecionada(e.target.value)}
                bg={selectBg}
                borderColor={inputBorder}
                w="250px"
              >
                {empresas.map((empresa, idx) => (
                  <option key={idx} value={empresa}>
                    {empresa}
                  </option>
                ))}
              </Select>

              <Input
                type="date"
                bg={inputBg}
                borderColor={inputBorder}
                value={dataInicial}
                onChange={e => setDataInicial(e.target.value)}
                w="170px"
              />
              <Input
                type="date"
                bg={inputBg}
                borderColor={inputBorder}
                value={dataFinal}
                onChange={e => setDataFinal(e.target.value)}
                w="170px"
              />
            </Flex>

            {/* listagem */}
            <VStack align="stretch" spacing={4}>
              {ordensFiltradas.length === 0 ? (
                <Text>Nenhuma ordem finalizada encontrada.</Text>
              ) : (
                ordensFiltradas.map(os => (
                  <Box
                    key={os.UnicID_OS}
                    p={4}
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={borderClr}
                    borderRadius="md"
                    transition="all 0.2s"
                    _hover={{ boxShadow: 'md', bg: hoverBg, cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/ordens-finalizadas/${os.UnicID_OS}`)}
                  >
                    <Text fontWeight="bold">Empresa: {os.empresa}</Text>

                    <Flex align="center" gap={2} mt={2} mb={2} flexWrap="wrap">
                      <Badge colorScheme="green">FINALIZADO</Badge>
                      <Badge
                        colorScheme={
                          os.TipoCliente === 'Empresarial'
                            ? 'blue'
                            : os.TipoCliente === 'Residencial'
                            ? 'green'
                            : 'gray'
                        }
                        fontSize="0.7em"
                        p={1}
                        rounded="md"
                      >
                        {os.TipoCliente || 'Tipo não informado'}
                      </Badge>
                    </Flex>

                    <Text><strong>Cliente:</strong> {os.Nome_Cliente}</Text>
                    <Text><strong>Técnico:</strong> {os.Tecnico_Responsavel || 'Sem Técnico'}</Text>
                    <Text><strong>Endereço:</strong> {os.Endereco_Cliente}</Text>
                    <Text fontSize="sm" color="gray.500" mt={2}>
                      Data de Envio: {new Date(os.Data_Envio_OS).toLocaleString('pt-BR')}
                    </Text>
                  </Box>
                ))
              )}
            </VStack>
          </>
        )}
      </Box>
    </Box>
  )
}
