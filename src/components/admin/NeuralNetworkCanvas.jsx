import { useEffect, useRef, useState } from 'react';
import { Box, Text, useBreakpointValue } from '@chakra-ui/react';

const TOTAL_POINTS = 30;

export default function NeuralNetworkCanvas({ ativo, lowUsage, dadosAPI = {} }) {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [pontos, setPontos] = useState([]);
  const [dadosTooltip, setDadosTooltip] = useState([]);
  const [bolinhasAlerta, setBolinhasAlerta] = useState([]);
  const isMobile = useBreakpointValue({ base: true, md: false });

  const agrupado = dadosAPI.agrupado || {};
  const ordens = dadosAPI.os || [];

  const dadosCombinados = [
    ...(agrupado.administracao || []),
    ...(agrupado.empresas || []),
    ...(agrupado.tecnicos || []),
    ...(agrupado.tarefas || []),
    ...(ordens || [])
  ];

  const extrairTooltip = (item) => {
    const email = item?.Email ?? item?.email_tecnico ?? null;
    const empresa = item?.empresa ?? item?.empresa_nome ?? null;
    const cliente = item?.Nome_Cliente ?? null;
    const status = item?.Status_OS ?? item?.status ?? null;
    const rawDate = item?.Data_Entrega_OS ?? item?.Data_Agendamento_OS ?? item?.Data_Envio_OS ?? item?.CreatedAt;

    return {
      tipo: cliente ? 'OS' : empresa ? 'Empresa' : email ? 'Email' : 'Outro',
      valor: cliente || empresa || email || '[Indefinido]',
      status: status || null,
      data: rawDate ? new Date(rawDate).toLocaleDateString() : null
    };
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const { width: w, height: h } = canvasRef.current;
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2.5;

    const pts = Array.from({ length: TOTAL_POINTS }, () => {
      const θ = Math.random() * 2 * Math.PI;
      return {
        x: cx + Math.cos(θ) * R,
        y: cy + Math.sin(θ) * R,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2
      };
    });

    setPontos(pts);
    setDadosTooltip(dadosCombinados.map(extrairTooltip));
  }, [dadosAPI]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMove = e => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const hit = pontos.findIndex(p => Math.hypot(p.x - mx, p.y - my) < 6);
      if (hit >= 0) {
        setHovered({ idx: hit, x: mx + 10, y: my + 10 });
      } else {
        setHovered(null);
      }
    };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', () => setHovered(null));
    return () => {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', () => setHovered(null));
    };
  }, [pontos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    function draw() {
      ctx.clearRect(0, 0, width, height);
      pontos.forEach((p1, i) => {
        for (let j = i + 1; j < pontos.length; j++) {
          const p2 = pontos[j];
          if (Math.hypot(p1.x - p2.x, p1.y - p2.y) < 120) {
            ctx.beginPath();
            ctx.strokeStyle = '#111';
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      pontos.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        const cor = dadosTooltip[i]
          ? '#FFD700'
          : bolinhasAlerta.includes(i)
          ? '#e61b00'
          : '#0da335';
        ctx.strokeStyle = cor;
        ctx.stroke();
      });

      requestAnimationFrame(draw);
    }

    draw();
  }, [pontos, dadosTooltip, bolinhasAlerta]);

  useEffect(() => {
    const iv = setInterval(() => {
      setPontos(ps => ps.map(p => {
        const speed = ativo ? 1 : 0.2;
        let x = p.x + p.dx * speed;
        let y = p.y + p.dy * speed;
        if (x < 0 || x > canvasRef.current.width) p.dx *= -1;
        if (y < 0 || y > canvasRef.current.height) p.dy *= -1;
        return {
          ...p,
          x: Math.max(0, Math.min(canvasRef.current.width, x)),
          y: Math.max(0, Math.min(canvasRef.current.height, y))
        };
      }));
    }, 30);
    return () => clearInterval(iv);
  }, [ativo]);

  useEffect(() => {
    const toggleAlerta = setInterval(() => {
      const novas = new Set();
      while (novas.size < 3) {
        novas.add(Math.floor(Math.random() * TOTAL_POINTS));
      }
      setBolinhasAlerta([...novas]);
    }, 1200);
    return () => clearInterval(toggleAlerta);
  }, []);

  return (
    <Box position="relative" w={{ base: '100%', md: '600px' }} h={{ base: '240px', md: '180px' }} mx="auto">
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        style={{ width: '100%', height: '100%', borderRadius: 12 }}
      />

      {hovered && hovered.idx < dadosTooltip.length && (
        <Box
          position="absolute"
          top={`${hovered.y}px`}
          left={`${hovered.x}px`}
          bg="gray.800"
          color="white"
          p={2}
          fontSize="xs"
          borderRadius="md"
          pointerEvents="none"
        >
          <Text><b>{dadosTooltip[hovered.idx].tipo}:</b> {dadosTooltip[hovered.idx].valor}</Text>
          {dadosTooltip[hovered.idx].status && <Text><b>Status:</b> {dadosTooltip[hovered.idx].status}</Text>}
          {dadosTooltip[hovered.idx].data && <Text><b>Data:</b> {dadosTooltip[hovered.idx].data}</Text>}
        </Box>
      )}
    </Box>
  );
}