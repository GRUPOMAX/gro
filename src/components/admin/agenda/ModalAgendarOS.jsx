import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, Select, FormControl, FormLabel, Input, Checkbox, VStack, useToast } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { apiGet, apiPatch } from '../../../services/api' // Ajusta se seu caminho for diferente
import { getToken } from 'firebase/messaging'
import { messaging } from '../../../firebase' // ajuste o caminho se necessário

function ModalAgendarOS({ isOpen, onClose, ordemId }) {
  const [tecnicos, setTecnicos] = useState([])
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState('')
  const [nomeTecnicoSelecionado, setNomeTecnicoSelecionado] = useState('')
  const [horario, setHorario] = useState('')
  const [qualquerHorario, setQualquerHorario] = useState(false)
  const toast = useToast()
  const [loading, setLoading] = useState(false)



  useEffect(() => {
    const buscarTecnicos = async () => {
      try {
        const res = await apiGet('/api/v2/tables/mpyestriqe5a1kc/records')
        setTecnicos(res.list)
      } catch (err) {
        console.error('Erro ao buscar técnicos:', err)
      }
    }

    if (isOpen) {
      buscarTecnicos()
    }
  }, [isOpen])

  const handleAgendar = async () => {
    try {
      setLoading(true);
  
      const res = await apiGet('/api/v2/tables/mtnh21kq153to8h/records');
  
      let registroEncontrado = null;
      let recordId = null;
      let novaListaEmpresas = [];
  
      for (const registro of res.list) {
        const raw = registro['Ordem de Serviços'];
        const json = typeof raw === 'string' ? JSON.parse(raw) : raw;
  
        const empresasAtualizadas = json.empresas.map(emp => {
          const ordensAtualizadas = emp.Ordens_de_Servico?.map(os => {
            if (os.UnicID_OS === ordemId) {
              recordId = registro.id || registro.Id;
              registroEncontrado = registro;
  
              return {
                ...os,
                ID_Tecnico_Responsavel: tecnicoSelecionado,
                Tecnico_Responsavel: nomeTecnicoSelecionado,
                Data_Agendamento_OS: new Date().toISOString(),
                Horario_Agendamento_OS: qualquerHorario ? null : horario,
                Status_OS: 'Agendada'
              };
            }
            return os;
          });
  
          return {
            ...emp,
            Ordens_de_Servico: ordensAtualizadas
          };
        });
  
        if (recordId) {
          novaListaEmpresas = empresasAtualizadas;
          break;
        }
      }
  
      if (!recordId || !registroEncontrado) {
        toast({
          title: 'Erro',
          description: 'Ordem não encontrada.',
          status: 'error',
          duration: 4000,
          isClosable: true
        });
        return;
      }
  
      const payload = [
        {
          Id: registroEncontrado.Id,
          'Ordem de Serviços': JSON.stringify({ empresas: novaListaEmpresas })
        }
      ];
  
      console.log('📤 PATCH AGENDAR:', payload);
  
      await apiPatch('/api/v2/tables/mtnh21kq153to8h/records', payload);
  
      // 🔔 Notificação
      const tecnico = tecnicos.find(t => t.ID_Tecnico_Responsavel === tecnicoSelecionado);
      const tecnicoUnicId = tecnico?.UnicID;
  
      const empresaUnicId = localStorage.getItem('UnicID');
      const dadosEmpresa = empresaUnicId
        ? await apiGet(`/api/v2/tables/mga2sghx95o3ssp/records?where=${encodeURIComponent(`(UnicID,eq,${empresaUnicId})`)}`)
        : null;
  
      const empresaData = dadosEmpresa?.list?.[0];
      const tokenEmpresa = [empresaData?.token_fcm, empresaData?.token_do_celular].filter(Boolean);
      const tokenTecnico = [tecnico?.token_fcm, tecnico?.token_do_celular].filter(Boolean);
  
      const mensagemAgendada = `Você recebeu uma nova ordem para ${horario ? new Date(horario).toLocaleString('pt-BR') : 'qualquer horário'}`;
  
      const tokenAtual = await getToken(messaging, {
        vapidKey: 'BPPTQNhpSdolM8HR4qNPxNvlKB3gPfcps0u2AjZTdN6t-rrwpJU9lgq0sE-_OHbqV_aWeQKcNGUzM42oi1XOXh4'
      });
  
      if (tecnicoUnicId) {
        const payloadTecnico = {
          id: tecnicoUnicId,
          tipo: 'tecnico',
          titulo: '📅 Nova Ordem Agendada',
          mensagem: mensagemAgendada,
          novoToken: tokenAtual
        };
      
        console.log('📦 Enviando payload para técnico:', payloadTecnico);
      
        await fetch('http://127.0.0.1:33003/notificar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadTecnico)
        });
      }
      
      if (empresaUnicId) {
        const payloadEmpresa = {
          id: empresaUnicId,
          tipo: 'empresa',
          titulo: '📅 Ordem Agendada com Técnico',
          mensagem: `Sua ordem foi agendada com ${nomeTecnicoSelecionado}.`,
          novoToken: tokenAtual
        };
      
        console.log('📦 Enviando payload para empresa:', payloadEmpresa);
      
        await fetch('http://127.0.0.1:33003/notificar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadEmpresa)
        });
      }


        // Atualizar a ordem visualmente no componente pai
        if (typeof onAgendado === 'function') {
          const novaOrdemAtualizada = novaListaEmpresas
            .flatMap(emp => emp.Ordens_de_Servico)
            .find(os => os.UnicID_OS === ordemId);

          if (novaOrdemAtualizada) {
            onAgendado(novaOrdemAtualizada);
          }
        }
      
  
      toast({
        title: '📨 Notificações enviadas com sucesso!',
        status: 'success',
        duration: 4000,
        isClosable: true
      });



  
      onClose(); // ✅ Aqui está no lugar certo!
  
    } catch (error) {
      console.error('❌ Erro ao agendar ou notificar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível agendar ou notificar.',
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };
  
        
  

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Agendar Ordem</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Técnico Responsável</FormLabel>
              <Select
                placeholder="Selecione o técnico"
                value={tecnicoSelecionado}
                onChange={(e) => {
                  setTecnicoSelecionado(e.target.value)
                  const tecnico = tecnicos.find(t => t.ID_Tecnico_Responsavel === e.target.value)
                  setNomeTecnicoSelecionado(tecnico?.Tecnico_Responsavel || '')
                }}
              >
                {tecnicos.map((tecnico) => (
                  <option key={tecnico.ID_Tecnico_Responsavel} value={tecnico.ID_Tecnico_Responsavel}>
                    {tecnico.Tecnico_Responsavel}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Horário</FormLabel>
              <Input
                type="datetime-local"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                disabled={qualquerHorario}
              />
            </FormControl>

            <Checkbox
              isChecked={qualquerHorario}
              onChange={(e) => setQualquerHorario(e.target.checked)}
            >
              Qualquer horário
            </Checkbox>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="purple" mr={3} onClick={handleAgendar}>
            Confirmar
          </Button>
          <Button onClick={onClose}>Cancelar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ModalAgendarOS
