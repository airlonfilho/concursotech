# 📊 Revisão do Projeto ConcursoTech (MVP)

Com base no seu documento de **Especificação** (`ConcursoTech Especificacao.docx`), na estrutura do banco de dados (Prisma) e nos componentes/telas desenvolvidos até agora, fiz um raio-x completo do sistema.

A boa notícia é que o "Core" (coração) do sistema está **100% estruturado** e os módulos mais complexos já estão prontos. Abaixo detalho o status atual:

---

## ✅ O que já está PRONTO e Funcionando

1. **Autenticação & Banco de Dados**
   - Sistema de Login/Registro e proteção de rotas com JWT.
   - Banco PostgreSQL operando com Prisma ORM e todo o schema pronto (Usuário, Concurso, Sessões, Flashcards, Planos, etc).

2. **Setup do Edital & Nivelamento**
   - Tela de **Edital** processando as matérias e tópicos.
   - Tela de **Nivelamento** (`/nivelamento`) que realiza o quiz de nivelamento por matéria usando IA.

3. **Geração de Plano de Estudos Inteligente**
   - Tela de **Plano** (`/plano`) que se comunica com o Gemini para gerar um cronograma da semana (Segunda a Domingo) focando nos pontos fracos.

4. **Sessões de Questões & Flashcards**
   - Tela de **Questões** (`/questoes`) rodando.
   - Tela de **Flashcards** (`/flashcards`) e avaliação funcional.
   - Registro de sessões de estudo (XP, Tempo, Acertos/Erros) no backend.

5. **Vídeo Aulas Personalizadas**
   - Tela de **Aulas** (`/aulas`) reformulada.
   - Faz o cruzamento automático da matéria ativa e tópico com o Youtube (sem uso da API paga, via scraping ilimitado).
   - Botão para marcar tópico como "Concluído" no edital.

6. **Histórico e Análises (Analytics)**
   - Tela de **Histórico** (`/historico`) com a timeline completa das sessões recentes.
   - Tela de **Análises** (`/analises`) com os gráficos de evolução, taxa de acerto, calor de erros por matérias e "Mentoria/Planos de Ação" recomendados pelo Gemini.

7. **UI/UX Premium**
   - Layout responsivo, Glassmorphism, botões modernos, Sidebar deslizante para mobile e Dark Mode nativo.

---

## 🚧 O que FALTA para finalizar 100% a especificação

Estes são os pontos que estão previstos no seu documento original, mas que ainda não possuem interface completa ou integração total:

### 1. AI Notes de Vídeo (Resumo de Aulas)
No documento consta a funcionalidade de *"Gera notas estruturadas com timestamps a partir do topico do video"*.
- Atualmente, você pode assistir ao vídeo e registrar a sessão, mas ainda não temos um botão "Gerar Resumo por IA" dentro da página de Aulas para transcrever e resumir o que está sendo falado. O banco já tem a coluna `ai_notes_json` esperando por isso.

### 2. Tela de Dashboard Geral (`/dashboard`)
Existe a rota `/dashboard` no menu do Sidebar, porém precisamos garantir que ela funcione como a "Página Inicial" perfeita: consolidando um resumo de hoje (O que estudar hoje no Plano, Quantos Flashcards atrasados, Streak atual, Resumo do XP).

### 3. Configurações de Perfil
A tela `/configuracoes` para permitir que o usuário troque a senha, atualize o nome/avatar, ou modifique os dados base do concurso (Data da prova, Banca, Cargo) para forçar o recálculo automático da IA.

### 4. Algoritmo SM-2 Fino (Flashcards)
Os flashcards existem, mas precisaríamos refinar o backend para garantir que os intervalos do algoritmo SM-2 (Revisão Espaçada) estejam atrasando os cards exatamente para 1, 3, 7 ou 14 dias de acordo com os botões "Fácil", "Médio" ou "Difícil".

### 5. Gamificação Avançada (Badges e Ranking)
O banco de dados já possui as tabelas `Badge` e `UsuarioBadge`, e o sistema já contabiliza XP. Porém, faltam:
- A lógica no backend para **desbloquear as conquistas** (ex: "7 Dias Seguidos", "100 Questões").
- Uma tela visual para mostrar as **Conquistas/Badges** bloqueadas e desbloqueadas.
- Um endpoint e tela de **Ranking** para comparar os usuários com mais XP na semana.

---

## 🚀 Próximos Passos (Recomendação)

Se você quiser continuar de imediato, recomendo atacarmos em uma destas ordens:
1. **Criar a tela de Dashboard principal**, para amarrar todas as informações logo no login.
2. **Implementar a Lógica de Badges/Conquistas**, porque aumenta muito o engajamento de uso.
3. **Página de Configurações do Usuário**, para ele poder alterar dados básicos.

O que você prefere que a gente desenvolva agora?
