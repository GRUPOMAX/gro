import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Heading,
  Select,
  Spinner,
  SimpleGrid,
  Text,
  useBreakpointValue,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react'
import { Settings } from 'lucide-react'
import { apiGet } from '../services/api'
import AdminSidebarDesktop from '../components/admin/AdminSidebarDesktop'
import AdminBottomNav from '../components/admin/AdminBottomNav'
import AdminMobileMenu from '../components/admin/AdminMobileMenu'

function OrdensEmExecucao() {
  const [ordens, setOrdens] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState('')
  const isMobile = useBreakpointValue({ base: true, md: false })
  const navigate = useNavigate()

  // color‑mode tokens
  const pageBg       = useColorModeValue('gray.50', 'gray.800')
  const cardBg       = useColorModeValue('white',   'gray.700')
  const borderClr    = useColorModeValue('gray.200','gray.600')
  const hoverBg      = useColorModeValue('gray.100','gray.600')
  const selectBg     = useColorModeValue('white',   'gray.600')
  const selectBorder = useColorModeValue('gray.300','gray.500')
  const textColor    = useColorModeValue('gray.800','gray.100')

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const [ordensRes, tecnicosRes] = await Promise.all([
          apiGet('/api/v2/tables/mtnh21kq153to8h/records'),
          apiGet('/api/v2/tables/mpyestriqe5a1kc/records')
        ])

        const listaTecnicos = tecnicosRes.list.map(t => ({
          nome: t.Tecnico_Responsavel,
          id:   t.ID_Tecnico_Responsavel
        }))
        setTecnicos(listaTecnicos)

        const todasOrdens = ordensRes.list.flatMap(item => {
          const json = typeof item['Ordem de Serviços'] === 'string'
            ? JSON.parse(item['Ordem de Serviços'])
            : item['Ordem de Serviços']

          return json.empresas.flatMap(emp =>
            emp.Ordens_de_Servico
              .filter(os => os.Status_OS === 'Execução')
              .map(os => ({
                ...os,
                empresa: emp.empresa
              }))
          )
        })

        setOrdens(todasOrdens)
      } catch (err) {
        console.error('Erro ao buscar ordens:', err)
      }
    }

    fetchDados()
  }, [])

  const ordensFiltradas = tecnicoSelecionado
    ? ordens.filter(os => os.ID_Tecnico_Responsavel === tecnicoSelecionado)
    : ordens

  // spinning icon keyframe
  useEffect(() => {
    const keyframes = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
    const styleSheet = document.createElement("style")
    styleSheet.type = "text/css"
    styleSheet.innerText = keyframes
    document.head.appendChild(styleSheet)
    return () => document.head.removeChild(styleSheet)
  }, [])

  const spinning = { animation: 'spin 1s linear infinite' }

  return (
    <Box display="flex" bg={pageBg} color={textColor}>
      {!isMobile && <AdminSidebarDesktop />}
      {isMobile && <AdminMobileMenu />}
      {isMobile && <AdminBottomNav />}

      <Box
        ml={!isMobile ? '250px' : 0}
        p={6}
        minH="100vh"
        pb={isMobile ? '100px' : 0}
      >
        <Heading size="lg" mb={4}>📋 Ordens em Execução</Heading>

        <Select
          placeholder="Filtrar por Técnico"
          mb={4}
          bg={selectBg}
          borderColor={selectBorder}
          onChange={e => setTecnicoSelecionado(e.target.value)}
        >
          {tecnicos.map(tecnico => (
            <option key={tecnico.id} value={tecnico.id}>
              {tecnico.nome}
            </option>
          ))}
        </Select>

        {ordensFiltradas.length === 0 ? (
          <Spinner size="lg" />
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {ordensFiltradas.map((os, i) => (
              <Box
                key={i}
                onClick={() => navigate(`/admin/ordem-execucao/${os.UnicID_OS}`)}
                cursor="pointer"
                _hover={{ bg: hoverBg }}
                p={4}
                borderWidth="1px"
                borderColor={borderClr}
                borderRadius="md"
                boxShadow="sm"
                bg={cardBg}
                position="relative"
              >
                <Box position="absolute" top={2} right={2}>
                  <Settings size={20} style={spinning} color="green" />
                </Box>
                <Text><strong>Cliente:</strong> {os.Nome_Cliente}</Text>
                <Text><strong>Telefone:</strong> {os.Telefone1_Cliente}</Text>

                <Box mt={2}>
                  <Text fontWeight="bold" mb={1}>Informações</Text>
                  <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                    <Badge colorScheme="blue" borderRadius="full" px={2} py={1} fontSize="xs">
                      {os.Tipo_OS}
                    </Badge>
                    <Badge
                      colorScheme={os.TipoCliente === 'Empresarial' ? 'blue' : 'green'}
                      fontSize="0.7em"
                      p={1}
                      rounded="md"
                    >
                      {os.TipoCliente || 'Tipo não informado'}
                    </Badge>
                  </Box>
                </Box>

                <Text mt={2}><strong>Endereço:</strong> {os.Endereco_Cliente}</Text>
                <Text><strong>Técnico:</strong> {os.Tecnico_Responsavel}</Text>
                <Text><strong>Empresa:</strong> {os.empresa}</Text>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>
    </Box>
  )
}

export default OrdensEmExecucao
