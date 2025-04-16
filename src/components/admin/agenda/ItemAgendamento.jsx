import { Box, Text, Flex, Badge, Button } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useDisclosure } from '@chakra-ui/react'
import ModalAgendarOS from './ModalAgendarOS'

function ItemAgendamento({ ordem }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [ordemAtual, setOrdemAtual] = useState(ordem)

  return (
    <Box
      p={4}
      borderWidth={1}
      borderRadius="lg"
      w="full"
      bg="white"
      shadow="sm"
    >
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontWeight="bold">{ordemAtual.Nome_Cliente}</Text>
        <Badge colorScheme="blue">{ordemAtual.Tipo_OS?.toUpperCase()}</Badge>
      </Flex>

      {/* NOVO: Tipo de Cliente */}
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
        <Text fontSize="xs" color="gray.500">
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

      {/* Modal de Agendamento */}
      <ModalAgendarOS
            isOpen={isOpen}
            onClose={onClose}
            ordemId={ordemAtual.UnicID_OS}
            onAgendado={(novaOrdem) => setOrdemAtual(novaOrdem)} // 👍 está correto
          />

    </Box>
  )
}
export default ItemAgendamento
