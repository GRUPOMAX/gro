import {
  Box, Heading, Text, Flex, Button, Stack, Badge, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Spinner, IconButton
} from '@chakra-ui/react';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiGet } from '../../services/api';
import TecnicoBottomNav from '../../components/tecnico/TecnicoBottomNav';
import { useOfflineData } from '../../hooks/useOfflineData';

function AgendaTecnico() {
  const [ordens, setOrdens] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const navigate = useNavigate();

  const tecnicoID = localStorage.getItem('ID_Tecnico_Responsavel');

  const [novosRegistros, setNovosRegistros] = useState(null);
  const { data: registrosCache, loading, offline } = useOfflineData({
    url: '/api/v2/tables/mtnh21kq153to8h/records',
    localKey: `ordens_tecnico_${tecnicoID}`
  });

  const registros = novosRegistros ? { list: novosRegistros } : registrosCache;

  const fetchNovosRegistros = useCallback(async () => {
    try {
      const res = await apiGet('/api/v2/tables/mtnh21kq153to8h/records');
      if (res?.list) {
        setNovosRegistros(res.list);
      }
    } catch (error) {
      console.error('Erro ao buscar novos registros:', error);
    }
  }, []);

    const formatarDataCabecalho = (data) => {
      return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
    }
  
    const formatarDataCompleta = (data) => {
      return data.toLocaleDateString('pt-BR')
    }

  const irParaAnterior = () => {
    const novaData = new Date(dataSelecionada);
    novaData.setDate(novaData.getDate() - 1);
    setDataSelecionada(novaData);
  };

  const irParaProximo = () => {
    const novaData = new Date(dataSelecionada);
    novaData.setDate(novaData.getDate() + 1);
    setDataSelecionada(novaData);
  };

  const getCorStatus = (status) => {
    switch (status) {
      case 'Atribuída': return 'blue';
      case 'Pendente': return 'yellow';
      case 'Execução': return 'orange';
      case 'Finalizada': return 'green';
      case 'Cancelado': return 'red';
      case 'Reagendada': return 'purple';
      case 'Agendada': return 'cyan'; // 💙 nova cor para agendada
      case 'Improdutiva': return 'gray';
      default: return 'gray';
    }
  };

  const irParaDetalhes = (ordem) => {
    if (ordem.UnicID_OS) {
      navigate(`/tecnico/ordem/${ordem.UnicID_OS}`, { state: { ordem } });
    }
  };
  const atualizarOrdens = useCallback(() => {
    if (!registros) return;
  
    const hoje = new Date(dataSelecionada);
    hoje.setHours(0, 0, 0, 0); // Ajusta para meia-noite (apenas a data)
  
    const lista = [];
  
    registros.list.forEach(registro => {
      const raw = registro['Ordem de Serviços'];
      const json = typeof raw === 'string' ? JSON.parse(raw) : raw;
  
      json.empresas.forEach(emp => {
        emp.Ordens_de_Servico?.forEach(ordem => {
          if (ordem.ID_Tecnico_Responsavel !== tecnicoID) return;
  
          const statusOS = ordem.Status_OS?.toLowerCase();
          let dataReferencia = '';
  
          // Se a ordem estiver agendada, vamos pegar a data de "Horario_Agendamento_OS"
          if (statusOS === 'finalizado') {
            dataReferencia = ordem?.Data_Entrega_OS?.slice(0, 10); // Data de entrega
          } else if (statusOS === 'agendada' || statusOS === 'execução' || statusOS === 'reagendada') {
            // Comparar apenas a data de "Horario_Agendamento_OS", ignorando a hora
            const horarioAgendamento = ordem?.Horario_Agendamento_OS || ordem?.Data_Agendamento_OS;
            if (horarioAgendamento) {
              dataReferencia = horarioAgendamento.slice(0, 10);
            }
          } else {
            dataReferencia = ordem?.Data_Envio_OS?.slice(0, 10); // Data de envio
          }
  
          const dataSelecionadaFormatada = hoje.toISOString().slice(0, 10); // Formato AAAA-MM-DD
  
          if (dataReferencia === dataSelecionadaFormatada) {
            lista.push({ ...ordem, empresa: emp.empresa, UnicID_Empresa: emp.UnicID_Empresa })

          }
        });
      });
    });
  
    // Evita que o estado seja atualizado se os dados não mudaram
    if (JSON.stringify(ordens) !== JSON.stringify(lista)) {
      setOrdens(lista);
    }
  }, [registros, tecnicoID, dataSelecionada, ordens]);
  

  // 👉 Atualiza uma vez ao carregar ou quando mudar a data
  useEffect(() => {
    atualizarOrdens();
  }, [atualizarOrdens]);

  // Antes do seu return (depois do useEffects)

  const handleAtualizarOrdens = async () => {
    await fetchNovosRegistros();
    atualizarOrdens();
  };

  // Modifica o useEffect também:
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNovosRegistros();
    }, 10000); // busca novos registros a cada 10 segundos

    return () => clearInterval(interval);
  }, [fetchNovosRegistros]);

  useEffect(() => {
    atualizarOrdens();
  }, [novosRegistros, dataSelecionada]);

  if (loading) return <Spinner mt={10} />;

  const ordensAbertas = ordens.filter(o => {
    const status = o.Status_OS?.toLowerCase();
    return status !== 'finalizado' && status !== 'cancelado' && status !== 'improdutivas' && status !== 'agendada';
  });

  const ordensAgendadas = ordens.filter(o => {
    const status = o.Status_OS?.toLowerCase();
    return status === 'agendada' || status === 'execução';
  });

  const ordensFinalizadas = ordens.filter(o => o.Status_OS?.toLowerCase() === 'finalizado');

  return (
    <Box pb="70px">
      {/* Topo agenda */}
      <Flex align="center" justify="space-between" p={4} bg="#3182ce" color="white">
        <Heading size="md">Minha agenda</Heading>
        <Button size="sm" colorScheme="whiteAlpha" onClick={handleAtualizarOrdens}>
          Atualizar
        </Button>
      </Flex>

      {/* Navegação de datas */}
      <Flex justify="center" align="center" gap={4} mt={4}>
        <IconButton
          icon={<ChevronLeft size={20} />}
          aria-label="Dia anterior"
          size="sm"
          onClick={irParaAnterior}
          variant="ghost"
          colorScheme="blue"
        />
        <Text fontWeight="bold">{formatarDataCabecalho(dataSelecionada)}</Text>
        <IconButton
          icon={<ChevronRight size={20} />}
          aria-label="Próximo dia"
          size="sm"
          onClick={irParaProximo}
          variant="ghost"
          colorScheme="blue"
        />
      </Flex>

      {/* Ordens abertas */}
      {ordensAbertas.length > 0 && (
        <Box mt={4} px={4}>
          <Text fontSize="sm" color="gray.600" mb={2}>Ordens em andamento</Text>
          <Stack spacing={4}>
            {ordensAbertas.map((ordem, idx) => (
              <Box
                key={idx}
                p={4}
                shadow="md"
                borderWidth="1px"
                borderRadius="lg"
                cursor="pointer"
                onClick={() => irParaDetalhes(ordem)}
              >
                <Text><strong>Cliente:</strong> {ordem.Nome_Cliente}</Text>
                <Text><strong>Endereço:</strong> {ordem.Endereco_Cliente}</Text>
                <Badge colorScheme={getCorStatus(ordem.Status_OS)}>{ordem.Status_OS}</Badge>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Ordens agendadas */}
      {ordensAgendadas.length > 0 && (
        <Box mt={4} px={4}>
          <Text fontSize="sm" color="gray.600" mb={2}>Ordens Agendadas</Text>
          <Stack spacing={4}>
            {ordensAgendadas.map((ordem, idx) => (
              <Box
                key={idx}
                p={4}
                shadow="md"
                borderWidth="1px"
                borderRadius="lg"
                cursor="pointer"
                onClick={() => irParaDetalhes(ordem)}
              >
                <Text><strong>Cliente:</strong> {ordem.Nome_Cliente}</Text>
                <Text><strong>Endereço:</strong> {ordem.Endereco_Cliente}</Text>
                <Badge colorScheme="purple">Agendada</Badge>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Ordens finalizadas em acordeon */}
      <Box mt={4} px={4}>
        <Accordion allowToggle>
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                {formatarDataCompleta(dataSelecionada)} - FINALIZADAS
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              {ordensFinalizadas.length > 0 ? (
                <Stack spacing={4}>
                  {ordensFinalizadas.map((ordem, idx) => (
                    <Box
                      key={idx}
                      p={4}
                      shadow="md"
                      borderWidth="1px"
                      borderRadius="lg"
                      cursor="pointer"
                      onClick={() => irParaDetalhes(ordem)}
                    >
                      <Text><strong>Cliente:</strong> {ordem.Nome_Cliente}</Text>
                      <Text><strong>Endereço:</strong> {ordem.Endereco_Cliente}</Text>
                      <Badge colorScheme={getCorStatus(ordem.Status_OS)}>{ordem.Status_OS}</Badge>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Text fontSize="sm" color="gray.500">Nenhuma ordem finalizada.</Text>
              )}
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Box>

      <TecnicoBottomNav />
    </Box>
  );
}

export default AgendaTecnico;
