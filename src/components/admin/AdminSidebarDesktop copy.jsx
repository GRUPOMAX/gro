import { Box, VStack, Text, Button, Collapse, Divider } from '@chakra-ui/react'
import {
  FiHome, FiSettings, FiLogOut, FiChevronDown, FiChevronUp,
  FiUsers, FiClipboard, FiUser, FiPlusSquare, FiCalendar,
  FiRefreshCw, FiCheckCircle, FiAlertCircle, FiXCircle, FiBarChart2,FiTerminal
} from 'react-icons/fi'

import { useNavigate, useLocation } from 'react-router-dom'

import { useState, useEffect } from 'react'

import { usarVerificacaoLimiteOS } from '../utils/verificarLimiteOS'

import { useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from '@chakra-ui/react'


function SidebarAdminDesktop() {
  const navigate = useNavigate()
  const [openCadastro, setOpenCadastro] = useState(false)
  const [openRelatorios, setOpenRelatorios] = useState(false)
  const [openOrdens, setOpenOrdens] = useState(false)
  const [mostrarMenuSecreto, setMostrarMenuSecreto] = useState(false) // 👈 menu secreto

  const tipoUsuario = localStorage.getItem('tipo')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const location = useLocation();


  const handleAbrirOS = usarVerificacaoLimiteOS(navigate, onOpen)
  
  
  
  // 👀 Detectar /desenvolvedor
  useEffect(() => {
    let buffer = ''

    const handleKeyDown = (e) => {
      if (!e.target.closest('input, textarea')) {
        if (e.key.length === 1) {
          buffer += e.key.toLowerCase()
        } else if (e.key === 'Backspace') {
          buffer = buffer.slice(0, -1)
        }

        if (buffer.includes('/desenvolvedor')) {
          setMostrarMenuSecreto(true)
          buffer = '' // limpa o buffer depois
        }

        if (buffer.length > 30) buffer = buffer.slice(-30) // nunca deixar muito longo
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])


  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <Box
      w="250px"
      h="100vh"
      bg="gray.800"
      color="white"
      p={5}
      position="fixed"
      top={0}
      left={0}
    >
      <Text fontSize="2xl" fontWeight="bold" mb={8}>
        Painel {tipoUsuario === 'admin' ? 'Admin' : 'Empresa'}
      </Text>

      <VStack align="stretch" spacing={4}>

      <Button
        leftIcon={<FiHome color="white" />}
        color="white"
        justifyContent="start"
        variant="ghost"
        _hover={{ bg: 'blue.600' }}
        onClick={() =>
          navigate(tipoUsuario === 'empresa' ? '/empresa' : '/admin')
        }
      >
        Dashboard
      </Button>

              {/* 🌟 MENU SECRETO */}
          {mostrarMenuSecreto && (
          <>
            <Divider borderColor="gray.600" mt={6} />
            <Text fontSize="sm" color="gray.400" px={2}>⚡ Área de Desenvolvedor</Text>

            <Button
              leftIcon={<FiTerminal color="white" />}
              color="white"
              justifyContent="start"
              variant="ghost"
              _hover={{ bg: 'purple.600' }}
              onClick={() => navigate('/admin/historico-conversas')}
            >
              Histórico de IA
            </Button>
            <Button
              leftIcon={<FiTerminal color="white" />}
              color="white"
              justifyContent="start"
              variant="ghost"
              _hover={{ bg: 'purple.600' }}
              onClick={() => navigate('/admin/metricas')}
            >
              Status da API
            </Button>
          </>
        )}


            {/* =================== ORDENS DE SERVIÇO =================== */}
            {tipoUsuario === 'admin' && (
              <>
                <Button
                  leftIcon={openOrdens ? <FiChevronUp color="white" /> : <FiChevronDown color="white" />}
                  color="white"
                  justifyContent="start"
                  variant="ghost"
                  _hover={{ bg: 'blue.600' }}
                  onClick={() => setOpenOrdens(!openOrdens)}
                >
                  Ordens de Serviço
                </Button>

                <Collapse in={openOrdens} animateOpacity>
                  <VStack align="stretch" pl={6} spacing={2}>

                  <Button
                    color="white"
                    variant="ghost"
                    justifyContent="start"
                    onClick={() => navigate('/admin/agenda')}
                    _hover={{ bg: 'blue.600', color: 'white' }}
                  >
                    Agenda
                  </Button>

                  <Button
                      color="white"
                      variant="ghost"
                      justifyContent="start"
                      onClick={() => navigate('/admin/ordens-agendadas')}
                      _hover={{ bg: 'blue.600', color: 'white' }}
                    >
                      Ordens Agendadas
                    </Button>

                    <Button
                      color="white"
                      variant="ghost"
                      justifyContent="start"
                      onClick={() => navigate('/admin/todas-ordens')}
                      _hover={{ bg: 'blue.600', color: 'white' }}
                    >
                      Todas as Ordens
                    </Button>


                    <Button
                      color="white"
                      variant="ghost"
                      justifyContent="start"
                      onClick={() => navigate('/admin/ordens-andamento')}
                      _hover={{ bg: 'blue.600', color: 'white' }}
                    >
                      Em Andamento
                    </Button>
                    <Button
                      color="white"
                      variant="ghost"
                      justifyContent="start"
                      onClick={() => navigate('/admin/ordens-finalizadas')}
                      _hover={{ bg: 'blue.600', color: 'white' }}
                    >
                      Finalizadas
                    </Button>
                    <Button
                      color="white"
                      variant="ghost"
                      justifyContent="start"
                      onClick={() => navigate('/admin/ordens-improdutivas')}
                      _hover={{ bg: 'blue.600', color: 'white' }}
                    >
                      Improdutivas
                    </Button>
                  </VStack>
                </Collapse>
              </>
            )}

            {/* =================== ACESSOS EMPRESA (SEM COLLAPSE) =================== */}
            {tipoUsuario === 'empresa' && (
              <>
                <Divider borderColor="gray.600" />
                <Text fontSize="sm" color="gray.400" px={2}>Empresa</Text>

                <Button
                    leftIcon={<FiPlusSquare color="white" />}
                    color="white"
                    variant={location.pathname === '/empresa/abrir-ordem' ? 'solid' : 'ghost'}
                    bg={location.pathname === '/empresa/abrir-ordem' ? 'blue.600' : 'transparent'}
                    justifyContent="start"
                    _hover={{ bg: 'blue.600', color: 'white' }}
                    onClick={handleAbrirOS}  // Chama a função de verificação de limite
                  >
                    Abrir O.S
                  </Button>

                <Button
                  leftIcon={<FiClipboard color="white" />}
                  color="white"
                  variant={location.pathname === '/empresa/ordens-abertas' ? 'solid' : 'ghost'}
                  bg={location.pathname === '/empresa/ordens-abertas' ? 'blue.600' : 'transparent'}
                  justifyContent="start"
                  _hover={{ bg: 'blue.600', color: 'white' }}
                  onClick={() => navigate('/empresa/ordens-abertas')}
                >
                  Em Aberto
                </Button>

                <Button
                  leftIcon={<FiCalendar color="white" />}
                  color="white"
                  variant={location.pathname === '/empresa/ordens-agendadas' ? 'solid' : 'ghost'}
                  bg={location.pathname === '/empresa/ordens-agendadas' ? 'blue.600' : 'transparent'}
                  justifyContent="start"
                  _hover={{ bg: 'blue.600', color: 'white' }}
                  onClick={() => navigate('/empresa/ordens-agendadas')}
                >
                  Agendadas
                </Button>

                <Button
                  leftIcon={<FiRefreshCw color="white" />}
                  color="white"
                  variant={location.pathname === '/empresa/ordens-andamento' ? 'solid' : 'ghost'}
                  bg={location.pathname === '/empresa/ordens-andamento' ? 'blue.600' : 'transparent'}
                  justifyContent="start"
                  _hover={{ bg: 'blue.600', color: 'white' }}
                  onClick={() => navigate('/empresa/ordens-andamento')}
                >
                  Em Andamento
                </Button>

                <Button
                  leftIcon={<FiCheckCircle color="white" />}
                  color="white"
                  variant={location.pathname === '/empresa/ordens-finalizadas' ? 'solid' : 'ghost'}
                  bg={location.pathname === '/empresa/ordens-finalizadas' ? 'blue.600' : 'transparent'}
                  justifyContent="start"
                  _hover={{ bg: 'blue.600', color: 'white' }}
                  onClick={() => navigate('/empresa/ordens-finalizadas')}
                >
                  Finalizadas
                </Button>

                <Button
                  leftIcon={<FiAlertCircle color="white" />}
                  color="white"
                  variant={location.pathname === '/empresa/ordens-pendenciadas' ? 'solid' : 'ghost'}
                  bg={location.pathname === '/empresa/ordens-pendenciadas' ? 'blue.600' : 'transparent'}
                  justifyContent="start"
                  _hover={{ bg: 'blue.600', color: 'white' }}
                  onClick={() => navigate('/empresa/ordens-pendenciadas')}
                >
                  Pendenciadas
                </Button>

                <Button
                  leftIcon={<FiXCircle color="white" />}
                  color="white"
                  variant={location.pathname === '/empresa/ordens-canceladas' ? 'solid' : 'ghost'}
                  bg={location.pathname === '/empresa/ordens-canceladas' ? 'blue.600' : 'transparent'}
                  justifyContent="start"
                  _hover={{ bg: 'blue.600', color: 'white' }}
                  onClick={() => navigate('/empresa/ordens-canceladas')}
                >
                  Canceladas
                </Button>

                <Button
                  leftIcon={<FiBarChart2 color="white" />}
                  color="white"
                  variant={location.pathname === '/empresa/metricas' ? 'solid' : 'ghost'}
                  bg={location.pathname === '/empresa/metricas' ? 'blue.600' : 'transparent'}
                  justifyContent="start"
                  _hover={{ bg: 'blue.600', color: 'white' }}
                  onClick={() => navigate('/empresa/metricas')}
                >
                  Métricas
                </Button>
              </>
            )}




            {/* =================== ÁREA DE ADMINISTRADOR =================== */}
            {tipoUsuario === 'admin' && (
                      <>
                        <Divider borderColor="gray.600" mt={6} />
                        <Text fontSize="sm" color="gray.400" px={2}>Administração</Text>

                        <Button
                          leftIcon={openCadastro ? <FiChevronUp color="white" /> : <FiChevronDown color="white" />}
                          color="white"
                          justifyContent="start"
                          variant="ghost"
                          _hover={{ bg: 'blue.600' }}
                          onClick={() => setOpenCadastro(!openCadastro)}
                        >
                          Cadastros
                        </Button>


                        <Collapse in={openCadastro} animateOpacity>
                          <VStack align="stretch" pl={6} spacing={2}>
                            <Button
                              color="white"
                              variant="ghost"
                              justifyContent="start"
                              onClick={() => navigate('/admin/cadastrar-empresa')}
                              _hover={{ bg: 'blue.600', color: 'white' }}
                            >
                              Cadastrar Empresa
                            </Button>
                            <Button
                              color="white"
                              variant="ghost"
                              justifyContent="start"
                              onClick={() => navigate('/admin/cadastrar-tecnico')}
                              _hover={{ bg: 'blue.600', color: 'white' }}
                            >
                              Cadastrar Técnico
                            </Button>
                          </VStack>
                        </Collapse>

                        
                        <Button
                          leftIcon={openRelatorios ? <FiChevronUp color="white" /> : <FiChevronDown color="white" />}
                          color="white"
                          justifyContent="start"
                          variant="ghost"
                          _hover={{ bg: 'blue.600' }}
                          onClick={() => setOpenRelatorios(!openRelatorios)}
                        >
                          Relatórios
                        </Button>

                        <Collapse in={openRelatorios} animateOpacity>
                          <VStack align="stretch" pl={6} spacing={2}>
                            <Button
                              color="white"
                              variant="ghost"
                              justifyContent="start"
                              onClick={() => navigate('/admin/relatorio-dasboard')}
                              _hover={{ bg: 'blue.600', color: 'white' }}
                            >
                              Relatórios Dashboard
                            </Button>
                          </VStack>
                        </Collapse>

                        <Button
                          leftIcon={<FiUsers color="white" />}
                          color="white"
                          justifyContent="start"
                          variant="ghost"
                          _hover={{ bg: 'blue.600' }}
                          onClick={() => navigate('/admin/empresas')}
                        >
                          Empresas
                        </Button>

                        <Button
                          leftIcon={<FiUser color="white" />}
                          color="white"
                          justifyContent="start"
                          variant="ghost"
                          _hover={{ bg: 'blue.600' }}
                          onClick={() => navigate('/admin/tecnicos')}
                        >
                          Técnicos
                        </Button>

                      </>
                    )}

        {/* =================== LOGOUT =================== */}
        <Button
          mt={10}
          leftIcon={<FiLogOut color="red" />}
          color="red.400"
          justifyContent="start"
          variant="ghost"
          _hover={{ bg: 'red.600', color: 'white' }}
          onClick={handleLogout}
        >
          Sair
        </Button>

        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Limite Atingido</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              O limite de O.S. foi atingido. Por favor, entre em contato com os administradores para solicitar mais ordens.
            </ModalBody>
            <ModalFooter>
              <Button onClick={onClose}>Fechar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

      </VStack>
    </Box>
  )
}

export default SidebarAdminDesktop
