
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
  useBreakpointValue,
  Flex,
  useColorModeValue
} from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost, apiGet, apiPatch } from '../services/api';  // Importando corretamente

import { v4 as uuidv4 } from 'uuid'

import AdminSidebarDesktop from '../components/admin/AdminSidebarDesktop'
import AdminBottomNav from '../components/admin/AdminBottomNav'
import AdminMobileMenu from '../components/admin/AdminMobileMenu'

function CadastroEmpresa() {
  const [form, setForm] = useState({
    email: '',
    senha: '',
    nome: '',
    empresa: '',
    limite_OS: ''
  })

  const toast = useToast()
  const navigate = useNavigate()
  const isMobile = useBreakpointValue({ base: true, md: false })



  const pageBg      = useColorModeValue('gray.50',  'gray.800')
  const formBg      = useColorModeValue('white',   'gray.700')
  const inputBg     = useColorModeValue('white',   'gray.600')
  const inputBorder = useColorModeValue('gray.300','gray.500')
  const textColor   = useColorModeValue('gray.800','gray.100')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const buscarEmpresas = async () => {
    try {
      const response = await apiGet('/api/v2/tables/mtnh21kq153to8h/records')
      // Verifique se a resposta tem o formato esperado
      if (response && response.list) {
        return response.list
      } else {
        console.error('Formato de resposta inesperado:', response)
        return []  // Retorna um array vazio caso a resposta seja inválida
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
      return []  // Retorna um array vazio em caso de erro
    }
  }
  

  const adicionarOuAtualizarEmpresa = async (UnicID_Empresa) => {
    // Primeira coisa: obter a `UnicID_Empresa` da tabela de administração
    const respostaAdmin = await apiGet('/api/v2/tables/mga2sghx95o3ssp/records');
    const registroAdmin = respostaAdmin.list[0]; // ou ajusta se for vários registros
    const UnicID_EmpresaAtual = registroAdmin.UnicID; // Aqui pegamos a UnicID da empresa
  
    // Caso a UnicID_Empresa seja null ou inválida, tratamos isso
    if (!UnicID_Empresa) {
      console.error('UnicID_Empresa não encontrada');
      return; // Pode retornar ou definir outro comportamento
    }
  
    // Agora buscamos a ordem de serviço da tabela de ordens
    const resposta = await apiGet('/api/v2/tables/mtnh21kq153to8h/records');
    const registro = resposta.list[0]; // ou ajusta se for vários registros
    let ordemServicos = typeof registro['Ordem de Serviços'] === 'string'
      ? JSON.parse(registro['Ordem de Serviços'])
      : registro['Ordem de Serviços'];
  
    // Garante que existe o array de empresas
    if (!ordemServicos.empresas) {
      ordemServicos.empresas = [];
    }
  
    const { nome, empresa, UnicID } = form;
  
    // Verifica se a empresa já existe, caso contrário, cria uma nova
    let empresaExistente = ordemServicos.empresas.find(e => e.UnicID_Empresa === UnicID_Empresa);
  
    if (empresaExistente) {
      // Se a empresa já existe, mantemos o array `Ordens_de_Servico` vazio
      empresaExistente.Ordens_de_Servico = [];  // Literalmente vazio como solicitado
    } else {
      // Se NÃO existe a empresa ainda, cria com array vazio
      const novaEmpresa = {
        empresa: empresa,
        UnicID_Empresa: UnicID_Empresa,
        Ordens_de_Servico: []  // Literalmente vazio
      };
  
      // Não adicionamos nenhuma ordem de serviço aqui
      ordemServicos.empresas.push(novaEmpresa);
    }
  
    // Agora atualiza no banco
    const response = await apiPatch('/api/v2/tables/mtnh21kq153to8h/records', {
      Id: registro.Id,
      'Ordem de Serviços': ordemServicos  // Envia com `Ordens_de_Servico: []`
    });
  
    if (response.status === 200) {
      console.log('Empresa e Ordem de Serviço atualizada corretamente!');
    } else {
      console.error('Erro ao atualizar empresa e ordem de serviço', response);
    }
  };
  
  
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const { email, senha, nome, empresa, limite_OS } = form;
    if (!email || !senha || !nome || !empresa || !limite_OS) {
      toast({ title: 'Preencha todos os campos.', status: 'error', duration: 3000 });
      return;
    }
  
    // Gerando o UnicID da empresa antes de enviar
    const UnicID_Empresa = uuidv4();  // Gerando o UnicID da empresa agora
  
    const payload = {
      Email: email.trim().toLowerCase(),
      password: senha.trim(),
      nome: nome.trim(),
      empresa_nome: empresa.trim(),
      tipo: 'empresa',
      UnicID: UnicID_Empresa, // Incluindo a UnicID gerada no payload
      Limite_de_Ordem: limite_OS,
    };
  
    try {
      await apiPost('/api/v2/tables/mga2sghx95o3ssp/records', payload);
      toast({ title: 'Empresa cadastrada com sucesso!', status: 'success', duration: 3000 });
  
      // Chama a função para adicionar ou atualizar a empresa na tabela mtnh21kq153to8h
      await adicionarOuAtualizarEmpresa(UnicID_Empresa);
  
      navigate('/login');
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao cadastrar empresa.', status: 'error', duration: 3000 });
    }
  };
  
  
  return (
    <Flex bg={pageBg} color={textColor} minH="100vh">
      {!isMobile && <AdminSidebarDesktop />}
      {isMobile && <AdminMobileMenu />}

      <Box
        ml={!isMobile ? '250px' : 0}
        p={6}
        w="full"
        pb={isMobile ? '60px' : 0}
        bg={pageBg}
      >
        {isMobile && <AdminBottomNav />}

        <Box
          maxW="md"
          mx="auto"
          mt={10}
          p={6}
          bg={formBg}
          borderRadius="md"
          shadow="md"
          borderWidth="1px"
          borderColor={inputBorder}
        >
          <Heading mb={6} size="lg" textAlign="center">
            Cadastro de Empresa
          </Heading>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Nome do Responsável</FormLabel>
                <Input
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  bg={inputBg}
                  borderColor={inputBorder}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Nome da Empresa</FormLabel>
                <Input
                  name="empresa"
                  value={form.empresa}
                  onChange={handleChange}
                  bg={inputBg}
                  borderColor={inputBorder}
                />
              </FormControl>

              <FormControl>
                <FormLabel>E‑mail</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  bg={inputBg}
                  borderColor={inputBorder}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Senha</FormLabel>
                <Input
                  name="senha"
                  type="password"
                  value={form.senha}
                  onChange={handleChange}
                  bg={inputBg}
                  borderColor={inputBorder}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Limite de O.S</FormLabel>
                <Input
                  name="limite_OS"
                  type="text"
                  value={form.limite_OS}
                  onChange={e => {
                    if (/^\d*$/.test(e.target.value)) handleChange(e)
                  }}
                  bg={inputBg}
                  borderColor={inputBorder}
                />
              </FormControl>

              <Button type="submit" colorScheme="blue" width="full">
                Cadastrar
              </Button>
            </VStack>
          </form>
        </Box>
      </Box>
    </Flex>
  )
}

export default CadastroEmpresa
