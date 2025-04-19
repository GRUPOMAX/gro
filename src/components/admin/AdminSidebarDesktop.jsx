// src/components/admin/SidebarAdminDesktop.jsx

import { 
  Box, 
  VStack, 
  Text, 
  Button, 
  Collapse, 
  Divider, 
  useColorModeValue,
  Icon,
  useDisclosure,
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  ModalCloseButton
} from '@chakra-ui/react'
import { FiClock } from 'react-icons/fi'
import {
  FiHome, FiSettings, FiLogOut, FiChevronDown, FiChevronUp,
  FiUsers, FiClipboard, FiUser, FiPlusSquare, FiCalendar,
  FiRefreshCw, FiCheckCircle, FiAlertCircle, FiXCircle, FiBarChart2, FiTerminal
} from 'react-icons/fi'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { usarVerificacaoLimiteOS } from '../utils/verificarLimiteOS'

export default function SidebarAdminDesktop() {
  const navigate = useNavigate()
  const location = useLocation()
  const tipoUsuario = localStorage.getItem('tipo')
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [openCadastro, setOpenCadastro] = useState(false)
  const [openRelatorios, setOpenRelatorios] = useState(false)
  const [openOrdens, setOpenOrdens] = useState(false)
  const [mostrarMenuSecreto, setMostrarMenuSecreto] = useState(false)

  const handleAbrirOS = usarVerificacaoLimiteOS(navigate, onOpen)

  // cores dinâmicas
  const bg        = useColorModeValue('white',     'gray.800')
  const color     = useColorModeValue('gray.800',  'white')
  const hoverBg   = useColorModeValue('gray.100',  'blue.600')
  const borderClr = useColorModeValue('gray.200',  'gray.600')
  const textHint  = useColorModeValue('gray.500',  'gray.400')

  // atalho secreto "/desenvolvedor"
  useEffect(() => {
    let buf = ''
    const onKey = e => {
      if (!e.target.closest('input, textarea')) {
        if (e.key.length === 1) buf += e.key.toLowerCase()
        else if (e.key === 'Backspace') buf = buf.slice(0, -1)
        if (buf.includes('/desenvolvedor')) {
          setMostrarMenuSecreto(true)
          buf = ''
        }
        if (buf.length > 30) buf = buf.slice(-30)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <Box
      w="250px"
      h="100vh"
      bg={bg}
      color={color}
      p={5}
      position="fixed"
      top={0}
      left={0}
      borderRight="1px"
      borderColor={borderClr}
    >
      <Text fontSize="2xl" fontWeight="bold" mb={8}>
        Painel {tipoUsuario === 'admin' ? 'Admin' : 'Empresa'}
      </Text>

      <VStack align="stretch" spacing={4}>

        <Button
          leftIcon={<Icon as={FiHome} />}
          variant="ghost"
          justifyContent="start"
          _hover={{ bg: hoverBg }}
          onClick={() =>
            navigate(tipoUsuario === 'empresa' ? '/empresa' : '/admin')
          }
        >
          Dashboard
        </Button>

        {/* menu secreto */}
        {mostrarMenuSecreto && (
          <>
            <Divider borderColor={borderClr} mt={6} />
            <Text fontSize="sm" color={textHint} px={2}>
              ⚡ Área de Desenvolvedor
            </Text>
            <Button
              leftIcon={<Icon as={FiTerminal} />}
              variant="ghost"
              justifyContent="start"
              _hover={{ bg: hoverBg }}
              onClick={() => navigate('/admin/historico-conversas')}
            >
              Histórico de IA
            </Button>
            <Button
              leftIcon={<Icon as={FiTerminal} />}
              variant="ghost"
              justifyContent="start"
              _hover={{ bg: hoverBg }}
              onClick={() => navigate('/admin/metricas')}
            >
              Status da API
            </Button>
          </>
        )}

        {/* ordens de serviço */}
        {tipoUsuario === 'admin' && (
          <>
            <Button
              leftIcon={
                openOrdens
                  ? <Icon as={FiChevronUp} />
                  : <Icon as={FiChevronDown} />
              }
              variant="ghost"
              justifyContent="start"
              _hover={{ bg: hoverBg }}
              onClick={() => setOpenOrdens(!openOrdens)}
            >
              Ordens de Serviço
            </Button>
            <Collapse in={openOrdens} animateOpacity>
              <VStack align="stretch" pl={6} spacing={2}>
                {[
                  { label: 'Agenda', path: '/admin/agenda' },
                  { label: 'Ordens Agendadas', path: '/admin/ordens-agendadas' },
                  { label: 'Todas as Ordens', path: '/admin/todas-ordens' },
                  { label: 'Em Andamento', path: '/admin/ordens-andamento' },
                  { label: 'Finalizadas', path: '/admin/ordens-finalizadas' },
                  { label: 'Improdutivas', path: '/admin/ordens-improdutivas' },
                ].map(({ label, path }) => (
                  <Button
                    key={path}
                    variant="ghost"
                    justifyContent="start"
                    _hover={{ bg: hoverBg }}
                    onClick={() => navigate(path)}
                  >
                    {label}
                  </Button>
                ))}
              </VStack>
            </Collapse>
          </>
        )}

        {/* empresa */}
        {tipoUsuario === 'empresa' && (
          <>
            <Divider borderColor={borderClr} />
            <Text fontSize="sm" color={textHint} px={2}>Empresa</Text>
            <VStack align="stretch" spacing={2}>
              <Button
                leftIcon={<Icon as={FiPlusSquare} />}
                variant={location.pathname === '/empresa/abrir-ordem' ? 'solid' : 'ghost'}
                bg={location.pathname === '/empresa/abrir-ordem' ? 'blue.600' : 'transparent'}
                justifyContent="start"
                _hover={{ bg: hoverBg }}
                onClick={handleAbrirOS}
              >
                Abrir O.S
              </Button>
              <Button
                leftIcon={<Icon as={FiClipboard} />}
                variant={location.pathname === '/empresa/ordens-abertas' ? 'solid' : 'ghost'}
                bg={location.pathname === '/empresa/ordens-abertas' ? 'blue.600' : 'transparent'}
                justifyContent="start"
                _hover={{ bg: hoverBg }}
                onClick={() => navigate('/empresa/ordens-abertas')}
              >
                Em Aberto
              </Button>
              <Button
                leftIcon={<Icon as={FiCalendar} />}
                variant={location.pathname === '/empresa/ordens-agendadas' ? 'solid' : 'ghost'}
                bg={location.pathname === '/empresa/ordens-agendadas' ? 'blue.600' : 'transparent'}
                justifyContent="start"
                _hover={{ bg: hoverBg }}
                onClick={() => navigate('/empresa/ordens-agendadas')}
              >
                Agendadas
              </Button>
              <Button
                leftIcon={<Icon as={FiRefreshCw} />}
                variant={location.pathname === '/empresa/ordens-andamento' ? 'solid' : 'ghost'}
                bg={location.pathname === '/empresa/ordens-andamento' ? 'blue.600' : 'transparent'}
                justifyContent="start"
                _hover={{ bg: hoverBg }}
                onClick={() => navigate('/empresa/ordens-andamento')}
              >
                Em Andamento
              </Button>
              <Button
                leftIcon={<Icon as={FiCheckCircle} />}
                variant={location.pathname === '/empresa/ordens-finalizadas' ? 'solid' : 'ghost'}
                bg={location.pathname === '/empresa/ordens-finalizadas' ? 'blue.600' : 'transparent'}
                justifyContent="start"
                _hover={{ bg: hoverBg }}
                onClick={() => navigate('/empresa/ordens-finalizadas')}
              >
                Finalizadas
              </Button>
              <Button
                leftIcon={<Icon as={FiAlertCircle} />}
                variant={location.pathname === '/empresa/ordens-pendenciadas' ? 'solid' : 'ghost'}
                bg={location.pathname === '/empresa/ordens-pendenciadas' ? 'blue.600' : 'transparent'}
                justifyContent="start"
                _hover={{ bg: hoverBg }}
                onClick={() => navigate('/empresa/ordens-pendenciadas')}
              >
                Pendenciadas
              </Button>
              <Button
                leftIcon={<Icon as={FiXCircle} />}
                variant={location.pathname === '/empresa/ordens-canceladas' ? 'solid' : 'ghost'}
                bg={location.pathname === '/empresa/ordens-canceladas' ? 'blue.600' : 'transparent'}
                justifyContent="start"
                _hover={{ bg: hoverBg }}
                onClick={() => navigate('/empresa/ordens-canceladas')}
              >
                Canceladas
              </Button>
              <Button
                leftIcon={<Icon as={FiBarChart2} />}
                variant={location.pathname === '/empresa/metricas' ? 'solid' : 'ghost'}
                bg={location.pathname === '/empresa/metricas' ? 'blue.600' : 'transparent'}
                justifyContent="start"
                _hover={{ bg: hoverBg }}
                onClick={() => navigate('/empresa/metricas')}
              >
                Métricas
              </Button>
              <Button
                leftIcon={<Icon as={FiClock} />}
                variant={location.pathname === '/empresa/historico-ordens' ? 'solid' : 'ghost'}
                bg={location.pathname === '/empresa/historico-ordens' ? 'blue.600' : 'transparent'}
                justifyContent="start"
                _hover={{ bg: hoverBg }}
                onClick={() => navigate('/empresa/historico-ordens')}
              >
                Histórico de Ordens
              </Button>

            </VStack>
          </>
        )}










        {/* cadastros e relatórios (admin) */}
        {tipoUsuario === 'admin' && (
          <>
            <Divider borderColor={borderClr} mt={6} />
            <Text fontSize="sm" color={textHint} px={2}>Administração</Text>

            <Button
              leftIcon={
                openCadastro
                  ? <Icon as={FiChevronUp} />
                  : <Icon as={FiChevronDown} />
              }
              variant="ghost"
              justifyContent="start"
              _hover={{ bg: hoverBg }}
              onClick={() => setOpenCadastro(!openCadastro)}
            >
              Cadastros
            </Button>
            <Collapse in={openCadastro} animateOpacity>
              <VStack align="stretch" pl={6} spacing={2}>
                <Button
                  variant="ghost"
                  justifyContent="start"
                  _hover={{ bg: hoverBg }}
                  onClick={() => navigate('/admin/cadastrar-empresa')}
                >
                  Cadastrar Empresa
                </Button>
                <Button
                  variant="ghost"
                  justifyContent="start"
                  _hover={{ bg: hoverBg }}
                  onClick={() => navigate('/admin/cadastrar-tecnico')}
                >
                  Cadastrar Técnico
                </Button>
              </VStack>
            </Collapse>

            <Button
              leftIcon={
                openRelatorios
                  ? <Icon as={FiChevronUp} />
                  : <Icon as={FiChevronDown} />
              }
              variant="ghost"
              justifyContent="start"
              _hover={{ bg: hoverBg }}
              onClick={() => setOpenRelatorios(!openRelatorios)}
            >
              Relatórios
            </Button>
            <Collapse in={openRelatorios} animateOpacity>
              <VStack align="stretch" pl={6} spacing={2}>
                <Button
                  variant="ghost"
                  justifyContent="start"
                  _hover={{ bg: hoverBg }}
                  onClick={() => navigate('/admin/relatorio-dasboard')}
                >
                  Relatórios Dashboard
                </Button>
              </VStack>
            </Collapse>

            <Button
              leftIcon={<Icon as={FiUsers} />}
              variant="ghost"
              justifyContent="start"
              _hover={{ bg: hoverBg }}
              onClick={() => navigate('/admin/empresas')}
            >
              Empresas
            </Button>
            <Button
              leftIcon={<Icon as={FiUser} />}
              variant="ghost"
              justifyContent="start"
              _hover={{ bg: hoverBg }}
              onClick={() => navigate('/admin/tecnicos')}
            >
              Técnicos
            </Button>
          </>
        )}

        {/* logout */}
        <Button
          mt={10}
          leftIcon={<Icon as={FiLogOut} />}
          color="red.400"
          variant="ghost"
          justifyContent="start"
          _hover={{ bg: 'red.600', color: 'white' }}
          onClick={handleLogout}
        >
          Sair
        </Button>

        {/* modal limite */}
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Limite Atingido</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              O limite de O.S. foi atingido. Entre em contato com os administradores.
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
