// src/pages/empresa/DetalheOrdemPendenciadaEmpresaBackup.jsx
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Heading, Text, Spinner, Stack, useBreakpointValue,
  Card, CardBody, Icon, Button, Collapse
} from '@chakra-ui/react'
import { Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react'
import { ArrowBackIcon } from '@chakra-ui/icons'
import { FaUserAlt, FaPhone, FaMapMarkerAlt, FaBuilding } from 'react-icons/fa'
import { useEffect, useState } from 'react'

import AdminSidebarDesktop from '../../components/admin/AdminSidebarDesktop'
import AdminBottomNav from '../../components/admin/AdminBottomNav'
import AdminMobileMenu from '../../components/admin/AdminMobileMenu'
import StepperOrdemServico from '../admin/StepperOrdemServico'

const steps = [
  { label: 'Atribuído', key: 'Msg0' },
  { label: 'Em Deslocamento', key: 'Msg1' },
  { label: 'Chegou no Local', key: 'Msg2' },
  { label: 'Execução', key: 'Msg3' },
  { label: 'Pendenciada', key: 'Msg4' }
]

export default function DetalheOrdemPendenciadaEmpresaBackup() {
  const { id } = useParams()
  const UnicID_Empresa = localStorage.getItem('UnicID')
  const isMobile = useBreakpointValue({ base: true, md: false })
  const navigate = useNavigate()

  const [ordem, setOrdem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedStep, setSelectedStep] = useState(null)

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch('https://backup-api-sgo.nexusnerds.com.br/backups')
        const { arquivos } = await res.json()
        const ultimo = arquivos[arquivos.length - 1]

        const resBackup = await fetch(`https://backup-api-sgo.nexusnerds.com.br/backups/${ultimo}`)
        const json = await resBackup.json()

        const empresa = json.empresas.find(e => e.UnicID_Empresa === UnicID_Empresa)
        const os = empresa?.Ordens_de_Servico.find(o => o.UnicID_OS === id)
        if (os) setOrdem({ ...os, empresa: empresa.empresa })
      } catch (err) {
        console.error('Erro ao carregar ordem do backup:', err)
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [id, UnicID_Empresa])

  if (loading) return <Spinner size="xl" mt={20} />
  if (!ordem) return <Text>Ordem não encontrada no backup.</Text>

  const currentStep = steps.findIndex(step => ordem.Status_OS?.toLowerCase().includes(step.label.toLowerCase()))

  return (
    <Box display="flex" flexDirection="column">
      {!isMobile && <AdminSidebarDesktop />}
      {isMobile && <AdminMobileMenu />}
      {isMobile && <AdminBottomNav />}

      <Box ml={!isMobile ? '250px' : 0} p={6} pb={isMobile ? '100px' : '0'}>
        <Heading size="lg" textAlign="center" color="purple.600" mb={6}>📌 Ordem Pendenciada (Backup)</Heading>

        <Button leftIcon={<ArrowBackIcon />} colorScheme="purple" variant="ghost" mb={4} onClick={() => navigate(-1)}>
          Voltar
        </Button>

        <Card bg="gray.50" boxShadow="xl" mb={8} rounded="lg">
          <CardBody>
            <Stack spacing={3}>
              <Text><strong>Técnico:</strong> {ordem.Tecnico_Responsavel || 'Não informado'}</Text>
              <Text><Icon as={FaUserAlt} mr={2} /> <strong>Cliente:</strong> {ordem.Nome_Cliente}</Text>
              <Text><Icon as={FaPhone} mr={2} /> <strong>Telefone:</strong> {ordem.Telefone1_Cliente}</Text>
              <Text><Icon as={FaMapMarkerAlt} mr={2} /> <strong>Endereço:</strong> {ordem.Endereco_Cliente}</Text>
              <Text><strong>Tipo:</strong> {ordem.Tipo_OS}</Text>
              <Text><strong>Status:</strong> {ordem.Status_OS}</Text>
              <Text><Icon as={FaBuilding} mr={2} /> <strong>Empresa:</strong> {ordem.empresa}</Text>
            </Stack>
          </CardBody>
        </Card>

        {ordem.Motivo_Pendenciamento && (
          <Accordion defaultIndex={[0]} allowToggle mb={6}>
            <AccordionItem>
              <h2>
                <AccordionButton bg="purple.50" borderRadius="lg">
                  <Box flex="1" textAlign="left" fontWeight="bold" color="purple.600">
                    ⚠️ Motivo do Pendenciamento
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4} bg="white" borderRadius="md">
                <Text fontSize="sm" color="gray.700">{ordem.Motivo_Pendenciamento}</Text>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        )}

        <Heading size="md" mb={4} color="purple.600">🔄 Andamento da Ordem</Heading>

        <StepperOrdemServico
          steps={steps}
          activeStep={currentStep === -1 ? 0 : currentStep}
          onStepClick={(index) => setSelectedStep(index === selectedStep ? null : index)}
        />

        <Stack spacing={4} mt={6}>
          {steps.map((step, index) => (
            <Collapse in={selectedStep === index} animateOpacity key={index}>
              <Box p={4} borderLeft="4px solid #805AD5" bg="white" rounded="md" boxShadow="md">
                <Text color="gray.600">{ordem?.Andamento_técnico?.[step.key] || 'Nenhuma informação registrada'}</Text>
              </Box>
            </Collapse>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}
