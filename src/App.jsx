import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Spinner, Center } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import OrdemServico from './pages/OrdemServico.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import EmpresaDashboard from './pages/empresa/EmpresaDashboard.jsx'
import CadastroEmpresa from './pages/CadastroEmpresa'
import EmpresasCadastradas from './pages/EmpresasCadastradas'
import OrdensEmAberto from './pages/OrdensEmAberto'
import CadastroTecnico from './pages/admin/CadastroTecnico.jsx'
import TecnicosList from './pages/admin/TecnicosList.jsx'
import PaginaMetricaTecnico from './pages/admin/PaginaMetricaTecnico.jsx'
import OrdensEmExecucao from './pages/OrdensExecucao.jsx'
import DetalheOrdemExecucao from './pages/admin/DetalheOrdemExecucao.jsx'
import PerfilAdmin from './pages/admin/PerfilAdmin'
import PerfilEmpresaPage from './pages/empresa/PerfilEmpresaPage'
import PerfilTecnico from './pages/tecnico/PerfilTecnico.jsx'
import OrdensEmAbertoEmpresa from './pages/empresa/OrdensEmAbertoEmpresa'

import HistoricoConversas from './pages/admin/historico-conversas.jsx'
import AdminMetricas from './components/admin/AdminMetricas.jsx'

import OrdensFinalizadas from './pages/admin/OrdensFinalizadas.jsx'
import DetalheOrdemFinalizadaAdmin from './pages/admin/DetalheOrdemFinalizadaAdmin.jsx'
import OrdensImprodutivas from './pages/admin/OrdensImprodutivas'
import DetalheOrdemImprodutivaAdmin from './pages/admin/DetalheOrdemImprodutivaAdmin'
import RelatoriosDashboardAdmin from './pages/admin/relatorios/RelatoriosDashboardAdmin.jsx'
import RelatorioEmpresaAdmin from './pages/admin/relatorios/RelatorioEmpresaAdmin.jsx'
import RelatorioEmpresaAnalise from './pages/admin/relatorios/RelatorioEmpresaAnalise.jsx'
import OrdensPendenciadasAdmin from './pages/admin/OrdensPendenciadasAdmin.jsx'
import DetalheOrdemPendenciadaAdmin from './pages/admin/DetalheOrdemPendenciadaAdmin.jsx'

import OrdensFinalizadasEmpresa from './pages/empresa/OrdensFinalizadasEmpresa.jsx'
import DetalheOrdemFinalizadaEmpresa from './pages/empresa/DetalheOrdemFinalizadaEmpresa'
import AbrirOrdemEmpresa from './pages/empresa/AbrirOrdemEmpresa'
import MetricasEmpresa from './pages/empresa/MetricasEmpresa'
import OrdensExecucaoEmpresa from './pages/empresa/OrdensExecucaoEmpresa'
import DetalheOrdemExecucaoEmpresa from './pages/empresa/DetalheOrdemExecucaoEmpresa' // depois vamos criar
import OrdensCanceladasEmpresa from './pages/empresa/OrdensCanceladasEmpresa'
import DetalheOrdemCanceladaEmpresa from './pages/empresa/DetalheOrdemCanceladaEmpresa.jsx'
import OrdensPendenciadasEmpresa from './pages/empresa/OrdensPendenciadasEmpresa.jsx'
import DetalheOrdemPendenciadaEmpresa from './pages/empresa/DetalheOrdemPendenciadaEmpresa.jsx'
import OrdensAgendadasEmpresa from './pages/empresa/OrdensAgendadasEmpresa.jsx'
import OrdensImprodutivasEmpresa from './pages/empresa/OrdensImprodutivasEmpresa.jsx'

import TecnicoDashboard from './pages/tecnico/TecnicoDashboard.jsx'
import OrdensAtribuidasTecnico from './pages/tecnico/OrdensAtribuidasTecnico'
import DetalheOrdemTecnico from './pages/tecnico/DetalheOrdemTecnico'
import FinalizarOS from './pages/tecnico/FinalizarOS.jsx'
import NotificacoesTecnico from './pages/tecnico/NotificacoesTecnico.jsx'
import TarefasPage from './pages/tecnico/TarefasPage.jsx'

import ConfiguracaoIntegracoes from './pages/tecnico/ConfiguracaoIntegracoes.jsx'


import OrdensAgendadas from './pages/OrdensAgendadas'


import { useSyncReagendamentos } from './hooks/useSyncReagendamentos'

import AdminAgenda from './pages/admin/AdminAgenda'


import EsqueciSenha from './pages/EsqueciSenha';
import RedefinirSenha from './pages/RedefinirSenha';


import { solicitarPermissaoENotificar } from './firebase' // <- já criamos no firebase.js

import { useToast } from '@chakra-ui/react'
import { onMessage } from 'firebase/messaging'
import { messaging } from './firebase'



function App() {
  useSyncReagendamentos()
  const [auth, setAuth] = useState(false)
  const [tipo, setTipo] = useState(null)
  const [loading, setLoading] = useState(true)





  const toast = useToast()

  // Mostrar toast com notificações recebidas
  useEffect(() => {
    const unsubscribe = onMessage(messaging, async (payload) => {
      try {
        const tokenAtual = await getToken(messaging, {
          vapidKey: 'BPPTQNhpSdolM8HR4qNPxNvlKB3gPfcps0u2AjZTdN6t-rrwpJU9lgq0sE-_OHbqV_aWeQKcNGUzM42oi1XOXh4'
        });
  
        const tokenDoUsuario = localStorage.getItem('token_do_celular') || localStorage.getItem('token_fcm');
  
        if (tokenAtual !== tokenDoUsuario) {
          console.warn('🔇 Notificação ignorada por não ser deste dispositivo.');
          return;
        }
  
        const { title, body } = payload?.notification || {}
  
        toast({
          title: title || '🔔 Nova notificação',
          description: body || 'Você recebeu uma mensagem.',
          status: 'info',
          duration: 5000,
          isClosable: true,
          position: 'top-right',
        })
  
        if (Notification.permission === 'granted') {
          new Notification(title || '🔔 Nova notificação', {
            body: body || 'Você recebeu uma mensagem.',
            icon: '/logo.png',
          })
        }
  
      } catch (err) {
        console.error('Erro ao validar token do dispositivo:', err);
      }
    })
  
    return () => unsubscribe()
  }, [toast])
  
  






  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const tipoUsuario = localStorage.getItem('tipo')
  
      setAuth(!!token)
      setTipo(tipoUsuario)
      setLoading(false)
    }
  
    checkAuth()
  
    // 🔥 NÃO FUNCIONA COM REDIRECT NA MESMA ABA
    // window.addEventListener('storage', checkAuth)
  
    // 🛠️ Em vez disso, atualiza sempre que a URL muda (rota muda)
    window.addEventListener('hashchange', checkAuth)
  
    return () => {
      window.removeEventListener('hashchange', checkAuth)
    }
  }, [])

  useEffect(() => {
    const autoLogin = async () => {
      setLoading(true) // ⬅️ começa carregando
      const savedEmail = localStorage.getItem('savedEmail')
      const savedSenha = localStorage.getItem('savedSenha')
  
      if (savedEmail && savedSenha && !localStorage.getItem('token')) {
        try {
          const queryEmpresa = encodeURIComponent(`(Email,eq,${savedEmail})~and(password,eq,${savedSenha})`)
          const queryTecnico = encodeURIComponent(`(email_tecnico,eq,${savedEmail})~and(senha,eq,${savedSenha})`)
  
          const [resEmpresa, resTecnico] = await Promise.all([
            apiGet(`/api/v2/tables/mga2sghx95o3ssp/records?where=${queryEmpresa}`),
            apiGet(`/api/v2/tables/mpyestriqe5a1kc/records?where=${queryTecnico}`)
          ])
  
          if (resEmpresa.list && resEmpresa.list.length > 0) {
            const user = resEmpresa.list[0]
            const tipoUsuario = user.tipo?.toLowerCase()
            
  
            await solicitarPermissaoENotificar(); // <== aqui
        
            localStorage.setItem('token', 'empresa-logada')
            localStorage.setItem('empresa_id', user.Id)
            localStorage.setItem('empresa_nome', user.empresa_nome || '')
            localStorage.setItem('email', user.Email)
            localStorage.setItem('tipo', tipoUsuario)
            localStorage.setItem('nome', user.nome || '')
            localStorage.setItem('foto_perfil', user.picture_perfil || '')
            localStorage.setItem('telefone', user.telefone || '')
            localStorage.setItem('UnicID', user.UnicID || '')
            localStorage.setItem('Limite_de_Ordem', user.Limite_de_Ordem || '')

  
            setAuth(true)
            setTipo(tipoUsuario)
            return
          }
  
          if (resTecnico.list && resTecnico.list.length > 0) {
            const tecnico = resTecnico.list[0]

            await solicitarPermissaoENotificar(); // <== aqui
  
            localStorage.setItem('token', 'tecnico-logado')
            localStorage.setItem('tecnico_id', tecnico.Id)
            localStorage.setItem('email', tecnico.email_tecnico)
            localStorage.setItem('nome', tecnico.Tecnico_Responsavel || '')
            localStorage.setItem('telefone', tecnico.telefone || '')
            localStorage.setItem('ID_Tecnico_Responsavel', tecnico.ID_Tecnico_Responsavel || '')
            localStorage.setItem('tipo', 'tecnico')
  
            setAuth(true)
            setTipo('tecnico')
            return
          }
        } catch (err) {
          console.error('Erro no auto login:', err)
        }
      }
  
      setLoading(false) // ⬅️ terminou carregamento
    }
  
    autoLogin()
  }, [])
  
    
  

  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('token')
      const tipoUsuario = localStorage.getItem('tipo')
  
      setAuth(!!token)
      setTipo(tipoUsuario)
    }, 100)
  
    return () => clearInterval(interval)
  }, [])
  
  
  

  // ✅ nova função para logout global
  const handleLogoutGlobal = () => {
    localStorage.clear()
    sessionStorage.clear()
    setAuth(false)
    setTipo(null)
    localStorage.removeItem('savedEmail')
    localStorage.removeItem('savedSenha')
  
    // Redirecionamento total, evitando cache e histórico
    window.location.replace('/ordens-servico-app/#/login')
  }
  

  
  
  

  if (loading) {
    return (
      <Center minH="100vh" bg="gray.100">
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="xl"
        />
      </Center>
    )
  }
  

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setAuth={setAuth} />} />

        <Route
          path="/"
          element={
            auth ? (
              tipo === 'admin' ? (
                <Navigate to="/admin" />
              ) : tipo === 'empresa' ? (
                <Navigate to="/empresa" />
              ) : tipo === 'tecnico' ? (
                <Navigate to="/tecnico" />
              ) : (
                <Navigate to="/login" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="/admin/agenda" element={<AdminAgenda />} />
        <Route path="/admin/ordens-agendadas" element={<OrdensAgendadas />} />


        <Route path="/ordem/:id" element={auth ? <OrdemServico /> : <Navigate to="/login" />} />
        <Route
          path="/admin"
          element={
            auth && tipo === 'admin' ? (
              <AdminDashboard setAuth={setAuth} onLogout={handleLogoutGlobal} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/empresa"
          element={
            auth && tipo === 'empresa' ? (
              <EmpresaDashboard setAuth={setAuth} onLogout={handleLogoutGlobal} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/admin/cadastrar-empresa" element={<CadastroEmpresa />} />
        <Route
            path="/admin/empresas"
            element={
              auth && tipo === 'admin' ? (
                <EmpresasCadastradas />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/admin/todas-ordens"
            element={
              auth && tipo === 'admin' ? (
                <OrdensEmAberto />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="/admin/cadastrar-tecnico" element={<CadastroTecnico />} />
          <Route path="/admin/tecnicos" element={<TecnicosList />} />
          
          <Route path="/admin/tecnico/:id" element={<PaginaMetricaTecnico />} />
          <Route path="/admin/ordens-andamento" element={<OrdensEmExecucao />} />
          <Route path="/admin/ordem-execucao/:id" element={<DetalheOrdemExecucao />} />

          <Route path="/admin/ordens-pendenciadas/:id" element={<DetalheOrdemPendenciadaAdmin />} />
          <Route path="/admin/ordens-pendenciadas" element={<OrdensPendenciadasAdmin />} />

          <Route path="/admin/ordens-finalizadas" element={<OrdensFinalizadas />} />
          <Route path="/admin/ordens-finalizadas/:id" element={<DetalheOrdemFinalizadaAdmin />} />

          <Route path="/admin/ordens-improdutivas" element={<OrdensImprodutivas />} />
          <Route path="/admin/ordens-improdutivas/:id" element={<DetalheOrdemImprodutivaAdmin />} />

          <Route path="/admin/relatorio-dasboard" element={<RelatoriosDashboardAdmin />} />
          <Route path="/admin/relatorios/:nomeEmpresa" element={<RelatorioEmpresaAdmin />} />
          <Route path="/admin/relatorios/empresa/:nomeEmpresa/analise" element={<RelatorioEmpresaAnalise />} />
          
          <Route path="/admin/historico-conversas" element={<HistoricoConversas />} />
          <Route path="/admin/metricas" element={<AdminMetricas />} />


          <Route path="/admin/perfil" element={<PerfilAdmin />} />
          <Route path="/empresa/perfil" element={<PerfilEmpresaPage />} />
          <Route path="/tecnico/perfil" element={<PerfilTecnico />} />
          <Route path="/tecnico/tarefas" element={<TarefasPage />} />

          <Route
            path="/empresa/ordens-abertas"
            element={auth && tipo === 'empresa' ? <OrdensEmAbertoEmpresa /> : <Navigate to="/login" />}
          />
          <Route path="/empresa/ordens-finalizadas" element={<OrdensFinalizadasEmpresa />} />
          <Route path="/empresa/ordem-finalizada/:id" element={<DetalheOrdemFinalizadaEmpresa />} />
          <Route path="/empresa/abrir-ordem" element={<AbrirOrdemEmpresa />} />
          <Route path="/empresa/metricas" element={<MetricasEmpresa />} />
          <Route path="/empresa/ordens-andamento" element={<OrdensExecucaoEmpresa />} />
          <Route path="/empresa/ordens-andamento/:id" element={<DetalheOrdemExecucaoEmpresa />} />
          <Route path="/empresa/ordens-canceladas" element={<OrdensCanceladasEmpresa />} />
          <Route path="/empresa/ordens-canceladas/:id" element={<DetalheOrdemCanceladaEmpresa />} />
          <Route path="/empresa/ordens-pendenciadas" element={<OrdensPendenciadasEmpresa />} />
          <Route path="/empresa/ordens-pendenciadas/:id" element={<DetalheOrdemPendenciadaEmpresa />} />
          <Route path="/empresa/ordens-agendadas" element={<OrdensAgendadasEmpresa />} />
          <Route path="/empresa/ordens-improdutivas" element={<OrdensImprodutivasEmpresa />} />


          <Route path="/tecnico/notificacoes" element={<NotificacoesTecnico />} />
          <Route path="/tecnico/config/integracao" element={<ConfiguracaoIntegracoes />} />
          <Route
            path="/tecnico"
            element={
              auth && tipo === 'tecnico' ? (
                <TecnicoDashboard />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/tecnico/ordens"
            element={
              auth && tipo === 'tecnico' ? (
                <OrdensAtribuidasTecnico />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/tecnico/ordem/:id"
            element={
              auth && tipo === 'tecnico' ? (
                <DetalheOrdemTecnico />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/tecnico/finalizar-os/:id"
            element={
              auth && tipo === 'tecnico' ? (
                <FinalizarOS />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />









      </Routes>
    </Router>
  )
}


export default App
