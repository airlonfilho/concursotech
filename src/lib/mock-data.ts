// Mock data for ConcursoTech application

export const mockUser = {
  name: "João Silva",
  email: "joao.silva@email.com",
  avatar: null,
  concurso: "Serpro — Analista de TI",
  nivel: "Intermediário",
  xp: 4250,
  streak: 7,
  rank: 12,
  totalStudyHours: 120,
  remainingHours: 64,
};

export const mockMateries = [
  {
    id: 1,
    name: "Redes de Computadores",
    icon: "hub",
    progress: 72,
    acertos: 68,
    questoes: 234,
    color: "#5c5cf0",
    topics: ["Modelo OSI", "TCP/IP", "Sub-redes", "IPv6", "Protocolos"],
  },
  {
    id: 2,
    name: "Banco de Dados",
    icon: "storage",
    progress: 58,
    acertos: 54,
    questoes: 189,
    color: "#a855f7",
    topics: ["SQL", "Normalização", "Transações ACID", "NoSQL"],
  },
  {
    id: 3,
    name: "Segurança da Informação",
    icon: "security",
    progress: 45,
    acertos: 62,
    questoes: 156,
    color: "#22c55e",
    topics: ["Criptografia", "Firewalls", "VPN", "PKI"],
  },
  {
    id: 4,
    name: "Sistemas Operacionais",
    icon: "computer",
    progress: 63,
    acertos: 71,
    questoes: 178,
    color: "#f59e0b",
    topics: ["Processos", "Memória", "File System", "Scheduler"],
  },
  {
    id: 5,
    name: "Engenharia de Software",
    icon: "code",
    progress: 38,
    acertos: 49,
    questoes: 112,
    color: "#3b82f6",
    topics: ["SOLID", "Design Patterns", "Ágil", "UML"],
  },
  {
    id: 6,
    name: "Raciocínio Lógico",
    icon: "functions",
    progress: 81,
    acertos: 79,
    questoes: 298,
    color: "#ef4444",
    topics: ["Proposições", "Silogismos", "Conjuntos", "Probabilidade"],
  },
];

export const mockQuestoes = [
  {
    id: "Q#98213",
    banca: "CESPE",
    ano: 2023,
    cargo: "Analista Judiciário",
    materia: "Redes de Computadores",
    enunciado:
      "Considere a arquitetura TCP/IP e o modelo de referência OSI. Em uma infraestrutura de rede corporativa altamente segmentada, um analista precisa diagnosticar um problema de comunicação entre duas sub-redes distintas que estão conectadas por meio de um roteador de borda.\n\nSabendo que os pacotes estão sendo descartados antes de atingirem o gateway padrão da sub-rede de destino, qual das seguintes camadas é a principal responsável por determinar o melhor caminho e realizar o roteamento lógico dos pacotes entre essas redes distintas?",
    alternativas: [
      { id: "A", texto: "Camada de Aplicação" },
      { id: "B", texto: "Camada de Transporte" },
      { id: "C", texto: "Camada de Rede (Network)" },
      { id: "D", texto: "Camada de Enlace (Data Link)" },
      { id: "E", texto: "Camada Física" },
    ],
    correta: "C",
    explicacao:
      "A Camada de Rede (Layer 3 no OSI, equivalente à Internet no TCP/IP) é responsável pelo endereçamento lógico (IP) e roteamento entre redes distintas. Os roteadores operam nessa camada para determinar o melhor caminho para os pacotes.",
    tags: ["OSI", "Roteamento", "TCP/IP"],
    dificuldade: "Média",
  },
  {
    id: "Q#10452",
    banca: "FGV",
    ano: 2022,
    cargo: "Senado Federal",
    materia: "Banco de Dados",
    enunciado:
      "Em relação à normalização de banco de dados relacionais, uma tabela está na Terceira Forma Normal (3FN) quando:",
    alternativas: [
      {
        id: "A",
        texto: "Não possui dependências parciais em relação à chave primária",
      },
      {
        id: "B",
        texto: "Satisfaz a 2FN e não possui dependências transitivas",
      },
      {
        id: "C",
        texto:
          "Todos os atributos são atômicos e não há grupos de repetição",
      },
      {
        id: "D",
        texto: "Está na BCNF e toda dependência funcional é trivial",
      },
      {
        id: "E",
        texto: "Não possui chaves candidatas compostas",
      },
    ],
    correta: "B",
    explicacao:
      "A 3FN exige que a tabela esteja na 2FN (sem dependências parciais) e que não haja dependências transitivas entre atributos não-chave. Ou seja, atributos não-chave devem depender APENAS da chave primária.",
    tags: ["Normalização", "3FN", "SQL"],
    dificuldade: "Difícil",
  },
];

export const mockFlashcards = [
  {
    id: 1,
    materia: "Redes de Computadores",
    deck: "Modelo OSI",
    frente: "Quais são as 7 camadas do Modelo OSI?",
    verso:
      "7. Aplicação\n6. Apresentação\n5. Sessão\n4. Transporte\n3. Rede\n2. Enlace\n1. Física\n\nMnemônico: 'As Pessoas Sempre Tentam Resolver Erros Físicos'",
    dificuldade: "nova",
    proximaRevisao: new Date(),
  },
  {
    id: 2,
    materia: "Redes de Computadores",
    deck: "Modelo OSI",
    frente: "Qual protocolo opera na Camada de Transporte?",
    verso:
      "TCP (Transmission Control Protocol) - orientado a conexão, garante entrega\nUDP (User Datagram Protocol) - sem conexão, sem garantia de entrega\n\nPortas: 0-1023 (well-known), 1024-49151 (registered), 49152-65535 (dynamic)",
    dificuldade: "difícil",
    proximaRevisao: new Date(),
  },
  {
    id: 3,
    materia: "Banco de Dados",
    deck: "SQL",
    frente: "O que é ACID em banco de dados?",
    verso:
      "A - Atomicidade: transação é tudo ou nada\nC - Consistência: leva o BD de um estado válido a outro\nI - Isolamento: transações concorrentes não se interferem\nD - Durabilidade: mudanças confirmadas são permanentes",
    dificuldade: "bom",
    proximaRevisao: new Date(Date.now() + 86400000),
  },
  {
    id: 4,
    materia: "Segurança",
    deck: "Criptografia",
    frente: "Diferença entre criptografia simétrica e assimétrica",
    verso:
      "Simétrica: mesma chave para cifrar/decifrar (AES, DES, 3DES)\n- Rápida, boa para grandes volumes\n- Problema de distribuição de chaves\n\nAssimétrica: par de chaves pública/privada (RSA, ECC)\n- Mais lenta, ideal para troca de chaves\n- Resolve o problema de distribuição",
    dificuldade: "fácil",
    proximaRevisao: new Date(Date.now() + 172800000),
  },
];

export const mockPlanoEstudos = {
  semana: [
    {
      dia: "Segunda",
      date: "17/03",
      blocos: [
        {
          materia: "Lógica Prog.",
          tipo: "Questões",
          duracao: "45 min",
          topico: "Estruturas de Dados",
          concluido: true,
        },
        {
          materia: "Eng. Software",
          tipo: "Vídeo/Aula",
          duracao: "45 min",
          topico: "Design Patterns",
          concluido: true,
        },
      ],
    },
    {
      dia: "Terça",
      date: "18/03",
      blocos: [
        {
          materia: "Redes",
          tipo: "Vídeo/Aula",
          duracao: "45 min",
          topico: "Modelo OSI / TCP",
          concluido: true,
        },
        {
          materia: "Banco Dados",
          tipo: "Questões",
          duracao: "45 min",
          topico: "Comandos SQL DML",
          concluido: false,
        },
      ],
    },
    {
      dia: "Quarta",
      date: "19/03",
      blocos: [
        {
          materia: "Segurança",
          tipo: "Revisão",
          duracao: "45 min",
          topico: "Criptografia Assimétrica",
          concluido: false,
        },
        {
          materia: "Simulado",
          tipo: "Completo",
          duracao: "90 min",
          topico: "Banca: Cebraspe 120 itens",
          concluido: false,
        },
      ],
    },
    {
      dia: "Quinta",
      date: "20/03",
      blocos: [
        {
          materia: "Português",
          tipo: "Vídeo/Aula",
          duracao: "45 min",
          topico: "Sintaxe do Período",
          concluido: false,
        },
        {
          materia: "Revisão Geral",
          tipo: "Flashcards",
          duracao: "60 min",
          topico: "Decks: Tech + Dir. Adm",
          concluido: false,
        },
      ],
    },
  ],
};

export const mockAnalises = {
  totalQuestoes: 1402,
  taxaAcertoGeral: 68.4,
  tendencia7dias: 4.2,
  mapaCalor: [
    {
      tema: "Modelo OSI (Camada 4)",
      materia: "Redes",
      taxaAcerto: 32,
      nivel: "Crítico",
    },
    {
      tema: "Sub-redes IPv6",
      materia: "Redes",
      taxaAcerto: 54,
      nivel: "Moderado",
    },
    {
      tema: "Normalização (3FN & BCNF)",
      materia: "Banco de Dados",
      taxaAcerto: 18,
      nivel: "Crítico",
    },
    {
      tema: "Transações ACID",
      materia: "Banco de Dados",
      taxaAcerto: 45,
      nivel: "Crítico",
    },
    {
      tema: "Gerenciamento de Memória (Paging)",
      materia: "S.O.",
      taxaAcerto: 76,
      nivel: "Leve",
    },
  ],
  questoesErradas: [
    { id: "Q#98213", banca: "CESPE", cargo: "Analista Judiciário", ano: 2023 },
    { id: "Q#10452", banca: "FGV", cargo: "Senado Federal", ano: 2022 },
    { id: "Q#77192", banca: "FCC", cargo: "TRT 4ª Região", ano: 2023 },
  ],
  evolucaoMensal: [45, 52, 58, 61, 65, 68, 68.4],
};

export const mockRanking = [
  { pos: 1, nome: "Ana Beatriz", xp: 8920, streak: 21, avatar: "AB" },
  { pos: 2, nome: "Carlos Mendes", xp: 8410, streak: 18, avatar: "CM" },
  { pos: 3, nome: "Fernanda Lima", xp: 7950, streak: 15, avatar: "FL" },
  { pos: 4, nome: "Diego Santos", xp: 7320, streak: 12, avatar: "DS" },
  { pos: 12, nome: "João Silva", xp: 4250, streak: 7, avatar: "JS", isMe: true },
];
