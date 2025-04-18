import { useEffect, useState } from 'react'
import {
  Box,
  Flex,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  useBreakpointValue,
  VStack,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react'
import { apiGet } from '../../services/api'
import { useNavigate } from 'react-router-dom'

function UltimasOrdens() {
  const [ordens, setOrdens] = useState([])
  const [loading, setLoading] = useState(true)
  const isMobile = useBreakpointValue({ base: true, md: false })
  const navigate = useNavigate()

  // cores adaptáveis
  const bgCard = useColorModeValue('white', 'gray.800')
  const hoverBg = useColorModeValue('gray.100', 'gray.700')
  const borderClr = useColorModeValue('gray.200', 'gray.600')
  const headingClr = useColorModeValue('gray.800', 'white')
  const textClr = useColorModeValue('gray.700', 'gray.200')
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700')
  const tableHoverBg = useColorModeValue('gray.100', 'gray.600')

  useEffect(() => {
    const buscarOrdens = async () => {
      try {
        const res = await apiGet(
          '/api/v2/tables/mtnh21kq153to8h/records?limit=1'
        )
        const registro = res.list?.[0]
        let listaOrdens = []

        if (registro && registro['Ordem de Serviços']) {
          const jsonOrdem =
            typeof registro['Ordem de Serviços'] === 'string'
              ? JSON.parse(registro['Ordem de Serviços'])
              : registro['Ordem de Serviços']

          const empresas = jsonOrdem.empresas || []
          empresas.forEach(empresa => {
            const ords = empresa.Ordens_de_Servico || []
            ords.forEach(o => {
              listaOrdens.push({
                ...o,
                empresa_nome: empresa.empresa || '---',
              })
            })
          })

          listaOrdens.sort(
            (a, b) => new Date(b.Data_Envio_OS) - new Date(a.Data_Envio_OS)
          )
        }

        setOrdens(listaOrdens.slice(0, 10))
      } catch (error) {
        console.error('Erro ao buscar ordens:', error)
      } finally {
        setLoading(false)
      }
    }

    buscarOrdens()
    const interval = setInterval(buscarOrdens, 30000)
    return () => clearInterval(interval)
  }, [])

  function irParaDetalhe(ordem) {
    if (!ordem?.Status_OS) return
    const status = ordem.Status_OS.toLowerCase()
    if (status.includes('execução')) {
      navigate(`/admin/ordem-execucao/${ordem.UnicID_OS}`)
    } else if (status.includes('pendente') || status.includes('pendenciada')) {
      navigate(`/admin/ordens-pendenciadas/${ordem.UnicID_OS}`)
    } else if (status.includes('finalizado')) {
      navigate(`/admin/ordens-finalizadas/${ordem.UnicID_OS}`)
    } else if (status.includes('improdutiva')) {
      navigate(`/admin/ordens-improdutivas/${ordem.UnicID_OS}`)
    } else {
      console.warn('Status desconhecido:', ordem.Status_OS)
    }
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="100px">
        <Spinner size="lg" />
      </Flex>
    )
  }

  return (
    <Box w="full" mt={10}>
      <Text fontSize="xl" fontWeight="bold" mb={4} color={headingClr}>
        Últimas Ordens de Serviço
      </Text>

      {isMobile ? (
        <VStack spacing={4} align="stretch">
          {ordens.length === 0 && (
            <Text textAlign="center" color={textClr}>
              Nenhuma ordem encontrada.
            </Text>
          )}
          {ordens.map((ordem, i) => (
            <Box
              key={i}
              p={4}
              shadow="sm"
              borderWidth="1px"
              borderColor={borderClr}
              borderRadius="md"
              bg={bgCard}
              onClick={() => irParaDetalhe(ordem)}
              _hover={{ bg: hoverBg, cursor: 'pointer' }}
            >
              <Text fontWeight="bold" color={textClr}>
                N° O.S.: {ordem.Numero_OS || '---'}
              </Text>
              <Text color={textClr}>
                <strong>Cliente:</strong> {ordem.Nome_Cliente || '---'}
              </Text>
              <Text color={textClr}>
                <strong>Empresa:</strong> {ordem.empresa_nome}
              </Text>
              <Flex gap={2} align="center" flexWrap="wrap" mt={2}>
                <Badge
                  colorScheme={
                    ordem.TipoCliente === 'Empresarial'
                      ? 'blue'
                      : ordem.TipoCliente === 'Residencial'
                      ? 'green'
                      : 'gray'
                  }
                  fontSize="0.7em"
                  p={1}
                  rounded="md"
                >
                  {ordem.TipoCliente || 'Tipo não informado'}
                </Badge>
                <Badge colorScheme={getStatusColor(ordem.Status_OS)}>
                  {ordem.Status_OS || '---'}
                </Badge>
              </Flex>
            </Box>
          ))}
        </VStack>
      ) : (
        <Table variant="simple" size="sm">
          <Thead bg={tableHeaderBg}>
            <Tr>
              {['N° O.S.', 'Cliente', 'Tipo Cliente', 'Empresa', 'Status', 'Data de Envio'].map(h => (
                <Th key={h} color={textClr}>
                  {h}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {ordens.map((ordem, i) => (
              <Tr
                key={i}
                _hover={{ bg: tableHoverBg, cursor: 'pointer' }}
                onClick={() => irParaDetalhe(ordem)}
              >
                <Td color={textClr}>{ordem.Numero_OS || '---'}</Td>
                <Td color={textClr}>{ordem.Nome_Cliente || '---'}</Td>
                <Td>
                  <Badge
                    colorScheme={
                      ordem.TipoCliente === 'Empresarial'
                        ? 'blue'
                        : ordem.TipoCliente === 'Residencial'
                        ? 'green'
                        : 'gray'
                    }
                    fontSize="0.7em"
                    p={1}
                    rounded="md"
                  >
                    {ordem.TipoCliente || 'Tipo não informado'}
                  </Badge>
                </Td>
                <Td color={textClr}>{ordem.empresa_nome}</Td>
                <Td>
                  <Badge colorScheme={getStatusColor(ordem.Status_OS)}>
                    {ordem.Status_OS || '---'}
                  </Badge>
                </Td>
                <Td color={textClr}>
                  {ordem.Data_Envio_OS
                    ? new Date(ordem.Data_Envio_OS).toLocaleString('pt-BR')
                    : '---'}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  )
}

function getStatusColor(status) {
  if (status === 'Execução') return 'green'
  if (status === 'Pendente') return 'yellow'
  if (status === 'Finalizado') return 'blue'
  return 'gray'
}

export default UltimasOrdens
