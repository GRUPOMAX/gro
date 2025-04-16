import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPatch } from '../services/api';
import { Box, Button, FormControl, FormLabel, Input, Flex, Heading, Image, useToast, Stack } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import DashboardAnimado from './DashboardAnimado';
import { solicitarPermissaoENotificar } from '../firebase';
import { getMessaging, getToken } from 'firebase/messaging';
import { messaging } from '../firebase'; // ajuste esse import com base no seu setup



// Detecta se é mobile
function isMobile() {
  return window.innerWidth <= 768;
}

function Login({ setAuth }) {
  const [email, setEmail] = useState(() => sessionStorage.getItem('temp_email') || '');
  const [senha, setSenha] = useState(() => sessionStorage.getItem('temp_senha') || '');
  const [carregandoLogin, setCarregandoLogin] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [mobile, setMobile] = useState(isMobile());
  const [tokenFCM, setTokenFCM] = useState('');

  const fullText = 'SGO';
  const toast = useToast();
  const navigate = useNavigate();


  useEffect(() => {
    async function gerarToken() {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: 'BPPTQNhpSdolM8HR4qNPxNvlKB3gPfcps0u2AjZTdN6t-rrwpJU9lgq0sE-_OHbqV_aWeQKcNGUzM42oi1XOXh4'
          });
          setTokenFCM(token);
        }
      } catch (error) {
        console.error('Erro ao obter token FCM:', error);
      }
    }
  
    gerarToken();
  }, []);


  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }
  const campoToken = isMobileDevice() ? 'token_do_celular' : 'token_fcm';


  // Seu useEffect de typing (SGO)
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(fullText.slice(0, index + 1));
      index++;
      if (index === fullText.length) {
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setCarregandoLogin(true);

    const emailLimpo = email.trim().toLowerCase();
    const senhaLimpa = senha.trim();

    if (!emailLimpo || !senhaLimpa) {
      toast({ title: 'Preencha todos os campos.', status: 'error', duration: 2000 });
      setCarregandoLogin(false);
      return;
    }

    try {
      const whereEmpresa = `(Email,eq,${emailLimpo})~and(password,eq,${senhaLimpa})`;
      const queryEmpresa = encodeURIComponent(whereEmpresa);
      const resEmpresa = await apiGet(`/api/v2/tables/mga2sghx95o3ssp/records?where=${queryEmpresa}`);

      if (resEmpresa.list && resEmpresa.list.length > 0) {
        const user = resEmpresa.list[0];
        const tipoUsuario = user.tipo?.toLowerCase();

      // 🔥 NOVA VERIFICAÇÃO: Bloqueia login se a empresa estiver inativa
      if (tipoUsuario === 'empresa' && user.status?.toLowerCase() === 'inativo') {
        toast({ title: 'Empresa desativada. Contate o suporte.', status: 'error', duration: 3000 });
        setCarregandoLogin(false);
        return;
      }

        localStorage.setItem('token', 'empresa-logada');
        localStorage.setItem('empresa_id', user.Id);
        localStorage.setItem('empresa_nome', user.empresa_nome || '');
        localStorage.setItem('email', user.Email);
        localStorage.setItem('tipo', tipoUsuario);
        localStorage.setItem('nome', user.nome || '');
        localStorage.setItem('foto_perfil', user.picture_perfil || '');
        localStorage.setItem('telefone', user.telefone || '');
        localStorage.setItem('UnicID', user.UnicID || '');
        localStorage.setItem('Limite_de_Ordem', user.Limite_de_Ordem || '');
        localStorage.setItem('savedEmail', emailLimpo);
        localStorage.setItem('savedSenha', senhaLimpa);

        setAuth(true);

        // 🟢 Salva o token FCM no campo `token_fcm` da empresa (se tiver token válido)
        let tokens = [];

        try {
          // 🔁 Busca versão mais atualizada diretamente da tabela (em caso de múltiplos logins simultâneos)
          const latest = await apiGet(`/api/v2/tables/mga2sghx95o3ssp/records?where=${encodeURIComponent(`(Id,eq,${user.Id})`)}`);
          const empresaAtualizada = latest.list?.[0];
          let parsedTokens;
          try {
            parsedTokens = JSON.parse(empresaAtualizada?.tokens_fcm || '[]');
            if (!Array.isArray(parsedTokens)) parsedTokens = [parsedTokens];
          } catch {
            parsedTokens = [];
          }
          tokens = parsedTokens;
          
        } catch {
          tokens = [];
        }
        
        
        if (!tokens.includes(tokenFCM)) {
          tokens.push(tokenFCM);

          console.log('📱 Token gerado:', tokenFCM);
          console.log('📦 Tokens finais salvos:', tokens);

        
          await apiPatch('/api/v2/tables/mga2sghx95o3ssp/records', [
            {
              Id: user.Id,
              tokens_fcm: tokens // SEM JSON.stringify!
            }
          ]);
          
          
        }
        
        
        
        // ⏱️ Redireciona após login
        setTimeout(() => {
          navigate(tipoUsuario === 'admin' ? '/admin' : '/empresa');
        }, 50);
        

        return;
      }

      const whereTecnico = `(email_tecnico,eq,${emailLimpo})~and(senha,eq,${senhaLimpa})`;
      const queryTecnico = encodeURIComponent(whereTecnico);
      const resTecnico = await apiGet(`/api/v2/tables/mpyestriqe5a1kc/records?where=${queryTecnico}`);

      if (resTecnico.list && resTecnico.list.length > 0) {
        const tecnico = resTecnico.list[0];

        localStorage.setItem('token', 'tecnico-logado');
        localStorage.setItem('tecnico_id', tecnico.Id);
        localStorage.setItem('email', tecnico.email_tecnico);
        localStorage.setItem('nome', tecnico.Tecnico_Responsavel || '');
        localStorage.setItem('telefone', tecnico.telefone || '');
        localStorage.setItem('ID_Tecnico_Responsavel', tecnico.ID_Tecnico_Responsavel || '');
        localStorage.setItem('tipo', 'tecnico');
        localStorage.setItem('savedEmail', emailLimpo);
        localStorage.setItem('savedSenha', senhaLimpa);

        setAuth(true);

        const tokenJaExiste = tecnico.token_fcm === tokenFCM || tecnico.token_do_celular === tokenFCM;

        if (!tokenJaExiste) {
          await apiPatch('/api/v2/tables/mpyestriqe5a1kc/records', {
            Id: tecnico.Id,
            [campoToken]: tokenFCM
          });
        }


        setTimeout(() => {
          navigate('/tecnico');
        }, 50);

        return;
      }

      toast({ title: 'E-mail ou senha inválidos.', status: 'error', duration: 3000 });
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao conectar com o servidor.', status: 'error', duration: 3000 });
    } finally {
      setCarregandoLogin(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/esqueci-senha');
  };

  
  if (mobile) {
    // 🔵 MOBILE
    return (
      <Flex minH="100vh" align="center" justify="center" bg="white">
        <Box
          w="full"
          maxW="xs"
          p={6}
          borderRadius="xl"
          textAlign="center"
          boxShadow="lg"
        >
          {/* Logo ou Ícone */}
          <Flex justify="center" mb={4}>
            <Image src="/logo.png" alt="Logo" boxSize="60px" />
          </Flex>
    
          {/* Título */}
          <Heading as="h2" size="lg" mb={2} color="black">
            Login
          </Heading>
    
          <Box fontSize="sm" color="gray.500" mb={6}>
            Sign in to continue.
          </Box>
    
          {/* Formulário */}
          <form onSubmit={handleLogin}>
            <FormControl mb={4}>
              <FormLabel fontSize="sm" color="gray.700" textAlign="left">
                Nome
              </FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                bg="gray.100"
                borderRadius="md"
                placeholder="Digite seu e-mail"
              />
            </FormControl>
    
            <FormControl mb={4}>
              <FormLabel fontSize="sm" color="gray.700" textAlign="left">
                Senha
              </FormLabel>
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                bg="gray.100"
                borderRadius="md"
                placeholder="••••••••"
              />
            </FormControl>
    
            <Button
              bg="black"
              color="white"
              _hover={{ bg: "gray.800" }}
              w="full"
              type="submit"
              isLoading={carregandoLogin}
              mt={2}
              mb={4}
              borderRadius="md"
            >
              Log in
            </Button>
          </form>
    

          {/* Links abaixo */}
          <Box fontSize="sm" color="gray.500" mt={4}>
            <Box as="span" mr={1}>Esqueceu a senha?</Box>
            <Box
              as="span"
              color="blue.500"
              fontWeight="bold"
              cursor="pointer"
              onClick={handleForgotPassword}
            >
              Recuperar
            </Box>
          </Box>

        </Box>
      </Flex>
    );
    
  }

  // 🖥️ DESKTOP
  return (
    <Flex minH="100vh">
      {/* Esquerda */}
      <Flex flex="0.6" align="center" justify="center" bg="blue.500" color="white" flexDirection="column" p={8}>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}
        >
          {displayedText}
        </motion.h1>
        <Heading size="md" mb={6} textAlign="center">
          Bem-vindo ao Sistema O.S
        </Heading>
        <Box w="full" maxW="sm">
          <form onSubmit={handleLogin}>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} bg="white" color="black" />
              </FormControl>
              <FormControl>
                <FormLabel>Senha</FormLabel>
                <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} bg="white" color="black" />
              </FormControl>
              <Button
                type="submit"
                w="full"
                bg="#3498db"
                color="white"
                _hover={{ bg: '#2980b9' }}
                isLoading={carregandoLogin}
              >
                Entrar
              </Button>

              {/* Links abaixo */}
              <Box fontSize="sm" color="black" mt={0}>
                <Box as="span" mr={1}>Esqueceu a senha?</Box>
                <Box
                  as="span"
                  color="white"
                  fontWeight="bold"
                  cursor="pointer"
                  onClick={handleForgotPassword}
                >
                  Recuperar
                </Box>
              </Box>
            </Stack>
          </form>
        </Box>
      </Flex>

      {/* Direita - Imagem */}
      <Flex flex="1.4" bg="white" align="center" justify="center">
        <DashboardAnimado />
      </Flex>

    </Flex>
  );
}

export default Login;
