// src/pages/empresa/HistoricoOrdensEmpresa.jsx
import {
    Box, Heading, Spinner, Text, Table, Thead, Tr, Th, Tbody, Td, Link, useBreakpointValue
  } from '@chakra-ui/react'
  import { useEffect, useState } from 'react'
  import { useNavigate } from 'react-router-dom'
  import AdminSidebarDesktop from '../../components/admin/AdminSidebarDesktop'
  import AdminBottomNav from '../../components/admin/AdminBottomNav'
  import AdminMobileMenu from '../../components/admin/AdminMobileMenu'
  
  function HistoricoOrdensEmpresa() {
    const [ordens, setOrdens] = useState([])
    const [loading, setLoading] = useState(true)
    const UnicID_Empresa = localStorage.getItem('UnicID')
    const isMobile = useBreakpointValue({ base: true, md: false })
    const navigate = useNavigate()
  
    useEffect(() => {
      const carregarOrdens = async () => {
        try {
          const res = await fetch('https://backup-api-sgo.nexusnerds.com.br/backups')
          const { arquivos } = await res.json()
          if (!arquivos?.length) return
  
          const ultimo = arquivos[arquivos.length - 1]
          const resBackup = await fetch(`https://backup-api-sgo.nexusnerds.com.br/backups/${ultimo}`)
          const json = await resBackup.json()
  
          const empresa = json.empresas?.find(e => e.UnicID_Empresa === UnicID_Empresa)
          if (empresa) setOrdens(empresa.Ordens_de_Servico || [])
        } catch (err) {
          console.error('Erro ao buscar histórico:', err)
        } finally {
          setLoading(false)
        }
      }
  
      carregarOrdens()
    }, [UnicID_Empresa])
  
        // 📍 Define rota com base no status
        const handleClick = (os) => {
            const id = os.UnicID_OS
            const status = (os.Status_OS || '').toLowerCase()
        
            switch (status) {
            case 'finalizado':
                return navigate(`/empresa/ordem-finalizada-backup/${id}`)
            case 'execução':
                return navigate(`/empresa/ordens-andamento/${id}`)
            case 'cancelado':
                return navigate(`/empresa/ordem-cancelada-backup/${id}`)
            case 'pendente':
            case 'pendenciada':
                return navigate(`/empresa/ordem-pendenciada-backup/${id}`)
            default:
                return alert('Status não reconhecido para redirecionamento.')
            }
        }
  
  
    return (
      <Box display="flex">
        <AdminSidebarDesktop />
        {isMobile && <AdminBottomNav />}
  
        <Box flex="1" ml={{ base: 0, md: '250px' }} p={6}>
          <Heading mb={4}>📋 Histórico de Ordens de Serviço</Heading>
  
          {loading ? (
            <Spinner size="xl" />
          ) : ordens.length === 0 ? (
            <Text>Nenhuma ordem encontrada no último backup.</Text>
          ) : (
            <Table variant="striped" colorScheme="gray" size="sm">
              <Thead>
                <Tr>
                  <Th>Cliente</Th>
                  <Th>Tipo</Th>
                  <Th>Status</Th>
                  <Th>Agendamento</Th>
                  <Th>PDF</Th>
                </Tr>
              </Thead>
              <Tbody>
                {ordens.map((os, idx) => (
                  <Tr key={idx} onClick={() => handleClick(os)} style={{ cursor: 'pointer' }}>
                    <Td>{os.Nome_Cliente}</Td>
                    <Td>{os.Tipo_OS}</Td>
                    <Td>{os.Status_OS}</Td>
                    <Td>
                      {os.Data_Agendamento_OS
                        ? new Date(os.Data_Agendamento_OS).toLocaleDateString()
                        : '—'}
                    </Td>
                    <Td>
                      {os.Link_Ordem_PDF ? (
                        <Link
                          href={os.Link_Ordem_PDF}
                          isExternal
                          color="blue.500"
                          onClick={(e) => e.stopPropagation()} // Evita trigger no row
                        >
                          Abrir PDF
                        </Link>
                      ) : '—'}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </Box>
    )
  }
  
  export default HistoricoOrdensEmpresa
  