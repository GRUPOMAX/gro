import { Box, Text, Flex, Badge, Button, useColorModeValue } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useDisclosure } from '@chakra-ui/react'
import ModalAgendarOS from './ModalAgendarOS'

function ItemAgendamento({ ordem }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [ordemAtual, setOrdemAtual] = useState(ordem)

  // cores adaptáveis
  const bgCard       = useColorModeValue('white',    'gray.800')
  const borderClr    = useColorModeValue('gray.200', 'gray.600')
  const textColor    = useColorModeValue('gray.800', 'gray.100')

  return (
    <Box
      p={4}
      borderWidth={1}
      borderColor={borderClr}
      borderRadius="lg"
      w="full"
      bg={bgCard}
      color={textColor}
      shadow="sm"
    >
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontWeight="bold">{ordemAtual.Nome_Cliente}</Text>
        <Badge colorScheme="blue">{ordemAtual.Tipo_OS?.toUpperCase()}</Badge>
      </Flex>

      <Flex justify="flex-start" align="center" mb={2} gap={2}>
        <Badge
          colorScheme={
            ordemAtual.TipoCliente === "Empresarial" ? "blue" :
            ordemAtual.TipoCliente === "Residencial" ? "green" :
            "gray"
          }
          fontSize="0.7em"
          px={2}
          py={1}
          rounded="md"
        >
          {ordemAtual.TipoCliente || "Tipo não informado"}
        </Badge>
      </Flex>

      <Text fontSize="sm" mb={1}>
        📍 {ordemAtual.Endereco_Cliente}
      </Text>

      <Text fontSize="sm" mb={2}>
        Observação: {ordemAtual.Observacao_Empresa || 'Nenhuma'}
      </Text>

      <Flex justify="space-between" align="center">
        <Text fontSize="xs" color={useColorModeValue('gray.500','gray.400')}>
          Enviado: {new Date(ordemAtual.Data_Envio_OS).toLocaleString()}
        </Text>

        {ordemAtual.Status_OS === "Agendada" ? (
          <Button size="sm" colorScheme="green" onClick={onOpen}>
            Agendado
          </Button>
        ) : (
          <Button size="sm" colorScheme="purple" onClick={onOpen}>
            Agendar
          </Button>
        )}
      </Flex>

      <ModalAgendarOS
        isOpen={isOpen}
        onClose={onClose}
        ordemId={ordemAtual.UnicID_OS}
        UnicID_Empresa={ordemAtual.UnicID_Empresa}
        onAgendado={novaOrdem => setOrdemAtual(novaOrdem)}
      />
    </Box>
  )
}

export default ItemAgendamento
