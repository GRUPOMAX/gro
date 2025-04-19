// src/pages/admin/AdminMetricas.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Box,
  Grid,
  Heading,
  Flex,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Select,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Text
} from '@chakra-ui/react';

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';



import NeuralNetworkCanvas from './NeuralNetworkCanvas';
import { apiGet } from '../../services/api';
import AdminSidebarDesktop from '../../components/admin/AdminSidebarDesktop';



const USAGE_THRESHOLD = 1;


export default function AdminMetricas() {
  const toast = useToast();

  const isTabHidden = useRef(false);
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState({
    administracao: 0,
    empresas: 0,
    tecnicos: 0,
    tarefas: 0,
    ordens: 0
  });
  const [graficoTempoReal, setGraficoTempoReal] = useState([]);
  const [graficoHistorico, setGraficoHistorico] = useState([]);
  const [filtroHistorico, setFiltroHistorico] = useState('tudo');
  const [tipoGraficoTempoReal, setTipoGraficoTempoReal] = useState('area');
  const [tipoGraficoHistorico, setTipoGraficoHistorico] = useState('line');
  const [dbOk, setDbOk] = useState(true);
  const [lowUsage, setLowUsage] = useState(false);

  const [dadosAPI, setDadosAPI] = useState([])    // onde vai cair o resultado das requisições
  const [error, setError]     = useState(null)    // pra guardar eventual erro
  const [mensagemBackup, setMensagemBackup] = useState(null)




  const bgPage  = useColorModeValue('gray.50', 'gray.800');
  const chartBg = useColorModeValue('white',   'gray.700');


  useEffect(() => {
    const tabelas = [
      { key: 'administracao', url: '/api/v2/tables/mga2sghx95o3ssp/records' },
      { key: 'empresas',      url: '/api/v2/tables/mdbub9a31zt7aly/records' },
      { key: 'tecnicos',      url: '/api/v2/tables/mpyestriqe5a1kc/records' },
      { key: 'tarefas',       url: '/api/v2/tables/mvgmphezonf3jyk/records' },
      { key: 'ordens',        url: '/api/v2/tables/mtnh21kq153to8h/records' },
      { key: 'integracoes',   url: '/api/v2/tables/my0sqoras5kz8fc/records' },
      { key: 'plataformas',   url: '/api/v2/tables/m3d1mb6n58ajo2u/records' },
    ];

    async function fetchAll() {
      const results = await Promise.allSettled(tabelas.map(t => apiGet(t.url)));
      const agrupado = {};
      results.forEach((res, idx) => {
        const key = tabelas[idx].key;
        const list = Array.isArray(res.value?.data?.list)
          ? res.value.data.list
          : Array.isArray(res.value?.list) ? res.value.list : [];
        agrupado[key] = list;
      });
      console.log('Agrupado:', agrupado);

      const osDeEmpresas = (agrupado.empresas || []).flatMap(emp => {
        const ords = Array.isArray(emp['Ordens de Serviço']) ? emp['Ordens de Serviço'] : [];
        return ords.map(os => ({ ...os, empresa: emp.empresa }));
      });

      const osDaTabela = (agrupado.ordens || []).flatMap(rec => {
        let os = rec['Ordem de Serviços'];
        if (typeof os === 'string') {
          try { os = JSON.parse(os); } catch { os = {}; }
        }
        return (os.empresas || []).flatMap(emp =>
          (emp.Ordens_de_Servico || []).map(ordem => ({
            ...ordem,
            empresa: emp.empresa
          }))
        );
      });

      const todas = [...osDeEmpresas, ...osDaTabela];
      console.log('Todas as OS (concat):', todas);
      setDadosAPI({ agrupado, os: todas });
    }

    fetchAll().catch(err => {
      console.error(err);
      setDadosAPI({ agrupado: {}, os: [] });
    });
  }, []);


  useEffect(() => {
    let ativo = true
  
    async function fetchStatusGeral() {
      try {
        const res = await fetch('https://backup-api-sgo.nexusnerds.com.br/status')
        const status = await res.json()
  
        if (ativo) {
          setDbOk(status.sucesso)
          setMensagemBackup(status.mensagem || null)
        }
      } catch (err) {
        console.error('Erro ao buscar status geral do sistema:', err)
        if (ativo) {
          setDbOk(false)
          setMensagemBackup(`Erro de conexão: ${err.message}`)
        }
      }
    }
  
    fetchStatusGeral()
    const intervalo = setInterval(fetchStatusGeral, 5000)
    return () => {
      ativo = false
      clearInterval(intervalo)
    }
  }, [])
  
  
  
  
  
  

  
  
  
  
  



  // Pausa as chamadas quando a aba está oculta
  useEffect(() => {
    const onVisibilityChange = () => {
      isTabHidden.current = document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // Busca métricas em tempo real a cada 10s, histórico a cada 60s
  useEffect(() => {
    let ativo = true;
    const fetchTempoReal = async () => {
      if (!ativo || isTabHidden.current) return;
      try {
        const [admin, emp, tec, tar, ordCount] = await Promise.all([
          apiGet('/api/v2/tables/mga2sghx95o3ssp/records/count'),
          apiGet('/api/v2/tables/mdbub9a31zt7aly/records/count'),
          apiGet('/api/v2/tables/mpyestriqe5a1kc/records/count'),
          apiGet('/api/v2/tables/mvgmphezonf3jyk/records/count'),
          apiGet('/api/v2/tables/mtnh21kq153to8h/records/count')
        ]);
        

        // calcula total de ordens
        const totalOrdens = ordCount.count || 0;


        const novos = {
          administracao: admin.count || 0,
          empresas:      emp.count   || 0,
          tecnicos:      tec.count   || 0,
          tarefas:       tar.count   || 0,
          ordens:        totalOrdens
        };
        setMetricas(novos);

        const totalUsage = Object.values(novos).reduce((a,b) => a + b, 0);
        setLowUsage(totalUsage < USAGE_THRESHOLD);

        const agora = new Date().toLocaleTimeString('pt-BR');
        setGraficoTempoReal(prev => {
          const slice20 = prev.length >= 20 ? prev.slice(-19) : prev;
          return [...slice20, { time: agora, ...novos }];
        });

        setLoading(false);
      } catch (err) {
        console.error(err);
        toast({
          title: 'Erro ao carregar métricas em tempo real',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    };

    const fetchHistorico = async () => {
      if (!ativo) return;
      try {
        const res = await fetch('https://savedb-gro.nexusnerds.com.br/historico-metricas');
        const data = await res.json();
        if (Array.isArray(data.historico)) {
          setGraficoHistorico(data.historico.map(item => ({
            dataHora: new Date(item.dataHora),
            time: new Date(item.dataHora).toLocaleTimeString('pt-BR'),
            administracao: item.administracao,
            empresas: item.empresas,
            tecnicos: item.tecnicos,
            tarefas: item.tarefas,
            ordens: item.ordens
          })));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchTempoReal();
    fetchHistorico();
    const intervalReal = setInterval(fetchTempoReal, 10_000);
    const intervalHist = setInterval(fetchHistorico, 60_000);

    return () => {
      ativo = false;
      clearInterval(intervalReal);
      clearInterval(intervalHist);
    };
  }, [toast]);
  


  const historicoSomenteMudancas = useMemo(() => {
    return graficoHistorico.reduce((acc, curr) => {
      if (
        acc.length === 0 ||
        curr.administracao !== acc[acc.length - 1].administracao ||
        curr.empresas     !== acc[acc.length - 1].empresas     ||
        curr.tecnicos     !== acc[acc.length - 1].tecnicos     ||
        curr.tarefas      !== acc[acc.length - 1].tarefas      ||
        curr.ordens       !== acc[acc.length - 1].ordens
      ) {
        acc.push(curr);
      }
      return acc;
    }, []);
  }, [graficoHistorico]);
  

  // filtra histórico localmente
  const dataHistFiltered = useMemo(() => {
    const agora = Date.now();
    // usa o array enxuto de mudanças como base
    const base = historicoSomenteMudancas;
    switch (filtroHistorico) {
      case '1h':
        return base.filter(i => agora - i.dataHora.getTime() <= 3_600_000);
      case '24h':
        return base.filter(i => agora - i.dataHora.getTime() <= 86_400_000);
      case '7d':
        return base.filter(i => agora - i.dataHora.getTime() <= 604_800_000);
      default:
        return base;
    }
  }, [historicoSomenteMudancas, filtroHistorico]);
  

  // memoiza render dos gráficos
  const memoGraficoTempoReal = useMemo(() => {
    if (tipoGraficoTempoReal === 'bar') {
      return (
        <BarChart data={graficoTempoReal}>
          <XAxis dataKey="time" /><YAxis /><Tooltip />
          <Bar dataKey="administracao" fill="#8884d8" />
          <Bar dataKey="empresas" fill="#82ca9d" />
          <Bar dataKey="tecnicos" fill="#ffc658" />
          <Bar dataKey="tarefas" fill="#ff8042" />
          <Bar dataKey="ordens" fill="#0088FE" />
        </BarChart>
      );
    }
    if (tipoGraficoTempoReal === 'radar') {
      return (
        <RadarChart data={graficoTempoReal} outerRadius={80}>
          <PolarGrid /><PolarAngleAxis dataKey="time" /><PolarRadiusAxis />
          <Radar dataKey="administracao" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          <Radar dataKey="empresas"      stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
          <Radar dataKey="tecnicos"      stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
          <Radar dataKey="tarefas"       stroke="#ff8042" fill="#ff8042" fillOpacity={0.6} />
          <Radar dataKey="ordens"        stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />
          <Tooltip />
        </RadarChart>
      );
    }
    const Chart   = tipoGraficoTempoReal === 'area' ? AreaChart : LineChart;
    const Element = tipoGraficoTempoReal === 'area' ? Area      : Line;
    return (
      <Chart data={graficoTempoReal}>
        <XAxis dataKey="time" /><YAxis /><Tooltip />
        <Element type="monotone" dataKey="administracao" stroke="#8884d8" fill="#8884d8" />
        <Element type="monotone" dataKey="empresas"      stroke="#82ca9d" fill="#82ca9d" />
        <Element type="monotone" dataKey="tecnicos"      stroke="#ffc658" fill="#ffc658" />
        <Element type="monotone" dataKey="tarefas"       stroke="#ff8042" fill="#ff8042" />
        <Element type="monotone" dataKey="ordens"        stroke="#0088FE" fill="#0088FE" />
      </Chart>
    );
  }, [graficoTempoReal, tipoGraficoTempoReal]);


  const memoGraficoHistorico = useMemo(() => {
    if (tipoGraficoHistorico === 'bar') {
      return (
        <BarChart data={dataHistFiltered}>
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="time" /><YAxis /><Tooltip />
          <Bar dataKey="administracao" fill="#8884d8" />
          <Bar dataKey="empresas"      fill="#82ca9d" />
          <Bar dataKey="tecnicos"      fill="#ffc658" />
          <Bar dataKey="tarefas"       fill="#ff8042" />
          <Bar dataKey="ordens"        fill="#0088FE" />
        </BarChart>
      );
    }
    if (tipoGraficoHistorico === 'radar') {
      const ultimo = dataHistFiltered.slice(-1)[0] || {};
      const radarData = [
        { subject: 'Administração', value: ultimo.administracao || 0 },
        { subject: 'Empresas',      value: ultimo.empresas      || 0 },
        { subject: 'Técnicos',      value: ultimo.tecnicos      || 0 },
        { subject: 'Tarefas',       value: ultimo.tarefas       || 0 },
        { subject: 'Ordens',        value: ultimo.ordens        || 0 }
      ];
      return (
        <RadarChart data={radarData} outerRadius={80}>
          <PolarGrid /><PolarAngleAxis dataKey="subject" /><PolarRadiusAxis />
          <Radar dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          <Tooltip />
        </RadarChart>
      );
    }
    const Chart   = tipoGraficoHistorico === 'area' ? AreaChart : LineChart;
    const Element = tipoGraficoHistorico === 'area' ? Area      : Line;
    return (
      <Chart data={dataHistFiltered}>
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="time" /><YAxis /><Tooltip />
        <Element type="monotone" dataKey="administracao" stroke="#8884d8" fill="#8884d8" />
        <Element type="monotone" dataKey="empresas"      stroke="#82ca9d" fill="#82ca9d" />
        <Element type="monotone" dataKey="tecnicos"      stroke="#ffc658" fill="#ffc658" />
        <Element type="monotone" dataKey="tarefas"       stroke="#ff8042" fill="#ff8042" />
        <Element type="monotone" dataKey="ordens"        stroke="#0088FE" fill="#0088FE" />
      </Chart>
    );
  }, [dataHistFiltered, tipoGraficoHistorico]);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg={bgPage}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg={bgPage}>
      <AdminSidebarDesktop />

      <Box flex="1" p={6} ml={{ base:0, md:'250px' }} pb={0}>
        <Heading mb={6}>Analise do Desenvolvedor</Heading>


        <Accordion allowToggle mb={6}>
          <AccordionItem>
            <h2>
              <AccordionButton bg={dbOk ? 'green.100' : 'red.100'}>
                <Box flex="1" textAlign="left" fontWeight="bold">
                  {dbOk
                    ? '✅ Sistema de Backup funcionando corretamente'
                    : '⚠️ Sistema de Backup apresentou erro recente'}
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Este painel mostra o status da última execução da API de backup das ordens de serviço. Ele é atualizado automaticamente toda vez que uma empresa atinge o dia de fechamento e executa o processo de backup e limpeza.
              </Text>

              {mensagemBackup && (
                <Box mt={3} p={3} bg="gray.50" border="1px solid #ccc" borderRadius="md">
                  <Text fontSize="xs" color="gray.700">
                    <strong>Mensagem:</strong> {mensagemBackup}
                  </Text>
                </Box>
              )}
            </AccordionPanel>
          </AccordionItem>
        </Accordion>



        <Grid templateColumns={{ base:'repeat(2,1fr)', md:'repeat(5,1fr)' }} gap={6} mb={10}>
          <CardMetricas label="Administração"     value={metricas.administracao} bgColor={chartBg}/>
          <CardMetricas label="Empresas"          value={metricas.empresas}  bgColor={chartBg}/>
          <CardMetricas label="Técnicos"          value={metricas.tecnicos} bgColor={chartBg}/>
          <CardMetricas label="Tarefas"           value={metricas.tarefas} bgColor={chartBg}/>
          <CardMetricas label="Ordens de Serviço" value={metricas.ordens} bgColor={chartBg}/>
        </Grid>

        <Box mb={4}>
          <NeuralNetworkCanvas
              ativo={true}
              lowUsage={lowUsage}
              dadosAPI={dadosAPI}  // aqui vem todas as OS já "desembrulhadas"
            />
        </Box>

        {/* Gráfico Tempo Real */}
        <Box
          bg={chartBg}
          p={6}
          borderRadius="xl"
          boxShadow="md"
          mb={10}
        >
          <Flex justify="space-between" mb={4} align="center">
            <Heading size="md">Gráfico em Tempo Real 📈</Heading>
            <Select
              w="200px"
              value={tipoGraficoTempoReal}
              onChange={e => setTipoGraficoTempoReal(e.target.value)}
            >
              <option value="line">Linha</option>
              <option value="area">Área</option>
              <option value="bar">Barra</option>
              <option value="radar">Radar</option>
            </Select>
          </Flex>
          <ResponsiveContainer width="100%" height={300}>
            {memoGraficoTempoReal}
          </ResponsiveContainer>
        </Box>

        {/* Gráfico Histórico */}
        <Box
          bg={chartBg}
          p={6}
          borderRadius="xl"
          boxShadow="md"
        >
          <Flex justify="space-between" mb={4} align="center" gap={4}>
            <Heading size="md">Histórico de Métricas 🕒</Heading>
            <Select
              w="150px"
              value={filtroHistorico}
              onChange={e => setFiltroHistorico(e.target.value)}
            >
              <option value="tudo">Tudo</option>
              <option value="1h">1 hora</option>
              <option value="24h">24 horas</option>
              <option value="7d">7 dias</option>
            </Select>
            <Select
              w="150px"
              value={tipoGraficoHistorico}
              onChange={e => setTipoGraficoHistorico(e.target.value)}
            >
              <option value="line">Linha</option>
              <option value="area">Área</option>
              <option value="bar">Barra</option>
              <option value="radar">Radar</option>
            </Select>
          </Flex>
          <ResponsiveContainer width="100%" height={300}>
            {memoGraficoHistorico}
          </ResponsiveContainer>
        </Box>


      </Box>
    </Flex>
  );
}

// remova a versão antiga e cole esta abaixo

const CardMetricas = React.memo(({ label, value, bgColor }) => {
  // se não recebeu bgColor como prop, cai no useColorModeValue
  const bg = bgColor ?? useColorModeValue('white', 'gray.700')
  return (
    <Box
      p={4}
      bg={bg}
      borderRadius="lg"
      boxShadow="md"
      textAlign="center"
    >
      <Stat>
        <StatLabel>{label}</StatLabel>
        <StatNumber>{value}</StatNumber>
        <StatHelpText>Atualizado</StatHelpText>
      </Stat>
    </Box>
  )
})

