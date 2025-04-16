import { useEffect, useState } from 'react'
import {
  Box,
  VStack,
  Flex,
  useBreakpointValue,
  Text,
  Button,
  Heading
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '../services/api'

import EstatisticasResumo from '../components/admin/EstatisticasResumo'
import ListaOrdensServico from '../components/admin/ListaOrdensServico'
import BotaoCriarOrdem from '../components/admin/BotaoCriarOrdem'
import AdminSidebarDesktop from '../components/admin/AdminSidebarDesktop'
import AdminBottomNav from '../components/admin/AdminBottomNav'
import AdminMobileMenu from '../components/admin/AdminMobileMenu'
import ResumoEstatisticas from '../components/admin/ResumoEstatisticas'
import ListaOrdensExecucao from '../components/admin/ListaOrdensExecucao'
import UltimasOrdens from '../components/admin/UltimasOrdens'
import AgenteIAFlutuante from '../components/admin/AgenteIAFlutuante' // 👈 importa certinho!
import BotaoEnviarNotificacaoDev from '../components/admin/BotaoEnviarNotificacaoDev'


function AdminDashboard({ setAuth }) {
  const isMobile = useBreakpointValue({ base: true, md: false })
  const [admin, setAdmin] = useState(null)
  const [dadosEmpresas, setDadosEmpresas] = useState(null) // 👈 cria o estado
  const [abrirChatIA, setAbrirChatIA] = useState(false)
  
  const navigate = useNavigate()

  useEffect(() => {
    const fetchAdmin = async () => {
      const id = localStorage.getItem('empresa_id')
      try {
        const res = await apiGet(`/api/v2/tables/mga2sghx95o3ssp/records/${id}`)
        setAdmin(res)
      } catch (err) {
        console.error('Erro ao carregar administrador:', err)
      }
    }

    const fetchDadosEmpresas = async () => {
      try {
        const res = await apiGet(`/api/v2/tables/mtnh21kq153to8h/records?limit=1`)
        const registro = res.list?.[0]
        if (registro && registro['Ordem de Serviços']) {
          const jsonOrdem = typeof registro['Ordem de Serviços'] === 'string'
            ? JSON.parse(registro['Ordem de Serviços'])
            : registro['Ordem de Serviços']
          setDadosEmpresas(jsonOrdem)
        }
      } catch (err) {
        console.error('Erro ao buscar dados das empresas:', err)
      }
    }

    fetchAdmin()
    fetchDadosEmpresas() // 👈 busca o JSON das ordens
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    sessionStorage.clear()
    setAuth(false)
    window.location.replace('/ordens-servico-app/#/login')
  }

  return (
    <Flex>
      {!isMobile && <AdminSidebarDesktop />}

      <Box p={6} ml={!isMobile ? '250px' : 0} w="full" pb={isMobile ? '60px' : 0} position="relative">
      {isMobile && <AdminBottomNav abrirChat={() => setAbrirChatIA(true)} />}


        {!isMobile && (
          <Box mb={6}>
            <Heading size="lg">Painel Administrativo</Heading>
            <Text>Olá, {admin?.Email}</Text>
          </Box>
        )}

        <VStack spacing={6}>
          <ResumoEstatisticas />
          <ListaOrdensExecucao />
          <UltimasOrdens />
        </VStack>
        <BotaoEnviarNotificacaoDev />

        {/* Só renderiza o Agente se já carregou os dados */}
        {dadosEmpresas && (
          <AgenteIAFlutuante empresasData={dadosEmpresas} forcarAbertura={abrirChatIA}   onFecharAbertura={() => setAbrirChatIA(false)} />

        )}
      </Box>
    </Flex>
  )
}

export default AdminDashboard
