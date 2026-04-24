# Plano de Ação - ConcursoTech

- [ ] **1. AI Notes de Vídeo (Resumo de Aulas)**
  - Criar endpoint `/api/aulas/[videoId]/notas`
  - Conectar ao Gemini para gerar notas baseadas no tópico do vídeo
  - Armazenar o cache na tabela `VideoCache`
  - Criar interface (botão e painel) na página `/aulas` para mostrar as notas

- [ ] **2. Configurações de Perfil**
  - Desenvolver a página `/configuracoes`
  - Permitir edição de nome, informações básicas e preferências do concurso
  - Rota de backend para atualização de dados

- [ ] **3. Algoritmo SM-2 Fino (Flashcards)**
  - Revisar endpoint de avaliação do flashcard
  - Garantir o recálculo preciso das revisões (intervalo 1, 3, 7 dias, etc.)

- [ ] **4. Tela de Dashboard Geral (`/dashboard`)**
  - Criar resumo da atividade diária e progresso semanal
  - Mostrar streak, flashcards pendentes, tarefas do dia

- [ ] **5. Gamificação Avançada (Badges e Ranking)**
  - Implementar lógica no backend para checagem e desbloqueio de badges
  - Criar tela de Badges e aba de Ranking Geral
