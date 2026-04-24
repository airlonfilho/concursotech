import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export async function explainQuestion(enunciado: string, gabarito: string, alternativaMarcada: string, correta: boolean) {
  const prompt = `
    Aja como um professor especialista em concursos públicos. 
    Analise a seguinte questão e explique o motivo da resposta ser a letra ${gabarito}.
    
    O usuário marcou a letra ${alternativaMarcada}. 
    Ele ${correta ? 'acertou' : 'errou'}.
    
    Enunciado da Questão:
    "${enunciado}"
    
    Gabarito oficial: Letra ${gabarito}
    O que o usuário marcou: Letra ${alternativaMarcada}

    Sua resposta deve:
    1. Ser em Português do Brasil.
    2. Ser concisa mas pedagógica.
    3. Explicar por que a alternativa correta está certa.
    4. Se o usuário errou, explicar brevemente o erro dele.
    5. Dar uma dica curta (bizu) para não esquecer mais esse tema.
    
    Formato da resposta: Apenas o texto da explicação, sem introduções como "Aqui está a explicação".
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Erro ao chamar o Gemini:", error);
    return "Não foi possível gerar a explicação automática no momento. Tente novamente mais tarde.";
  }
}

export async function generateFlashcards(materia: string, cargo: string, nivel: string = "INICIANTE") {
  const prompt = `
    Como professor de concursos para o cargo de "${cargo}", crie 5 flashcards de revisão para a matéria de "${materia}".
    O nível de conhecimento do aluno nesta matéria é: "${nivel}".
    
    Instruções para o nível:
    - Se INICIANTE: foque em conceitos de base, definições literais e fundamentos.
    - Se INTERMEDIARIO: foque em prazos, exceções, jurisprudência básica e comparações.
    - Se AVANCADO: foque em detalhes técnicos complexos, pegadinhas de banca e tópicos de alta dificuldade.
    
    Os flashcards devem focar em conceitos fundamentais, definições e "pegadinhas" comuns de prova.
    A resposta deve ser APENAS um JSON no seguinte formato (sem markdown):
    [
      { "frente": "pergunta curta", "verso": "resposta explicativa concisa" },
      { "frente": "...", "verso": "..." }
    ]
    
    Garanta que o conteúdo seja em Português do Brasil e útil para o nível médio/superior.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Erro ao gerar flashcards no Gemini:", error);
    return [];
  }
}

export async function generateWeeklyPlan(cargo: string, horasDia: number, nivelamentos: any[], editalJson?: any) {
  const prompt = `
    Aja como um mentor de concursos públicos de alto rendimento.
    Crie um Plano de Estudos Semanal (segunda a domingo) para o cargo de "${cargo}".
    O aluno tem ${horasDia} horas disponíveis por dia.
    
    Status de Nivelamento do Aluno (seu conhecimento atual):
    ${nivelamentos.map(n => `- ${n.materia}: ${n.nivel}`).join('\n')}

    ${editalJson ? `Conteúdo Programático Oficial (Foque nestes tópicos): ${JSON.stringify(editalJson)}` : ''}
    
    Instruções:
    1. Divida o tempo diário entre as matérias do edital.
    2. Dê mais peso para as matérias onde o aluno é "INICIANTE" ou que têm muitos tópicos.
    3. Para cada bloco de estudo, sugira um TÓPICO específico do edital para estudar.
    4. Inclua blocos de "Revisão" e "Resolução de Questões".
    5. Retorne APENAS o JSON.

    A resposta deve ser APENAS um JSON no seguinte formato:
    {
      "segunda": [ { "materia": "...", "tempo": "...", "foco": "Tópico X do edital" }, ... ],
      "terca": ...,
      "quarta": ...,
      "quinta": ...,
      "sexta": ...,
      "sabado": ...,
      "domingo": ...
    }
  `;


  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Erro ao gerar plano no Gemini:", error);
    return null;
  }
}


export async function generateMentoriaAnalyses(prompt: string) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    
    // Tenta encontrar o primeiro [ e o último ] para garantir JSON limpo
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']') + 1;
    if (start === -1 || end === 0) return null;
    
    return JSON.parse(text.substring(start, end));
  } catch (error) {
    console.error("Erro ao gerar mentoria no Gemini:", error);
    return null;
  }
}

export async function parseSyllabus(text: string) {
  const prompt = `
    Aja como um especialista em editais de concursos. 
    Analise o texto abaixo que contém o Conteúdo Programático de um concurso.
    Extraia as DISCIPLINAS (matérias) e os TÓPICOS de cada uma.
    
    Texto do Edital:
    "${text.substring(0, 10000)}"
    
    Instruções:
    1. Organize em um JSON onde a chave é a Disciplina e o valor é um array de strings com os tópicos reduzidos (máximo 5 palavras por tópico).
    2. Ignore textos burocráticos, datas ou bibliografias.
    3. Retorne APENAS o JSON puro, sem markdown.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleanText = response.text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Erro ao parsear edital no Gemini:", error);
    return null;
  }
}

export async function rankVideos(videos: any[], materia: string, topico: string) {
  const prompt = `
    Aja como um curador de conteúdo educacional para concursos públicos.
    Analise a lista de vídeos abaixo e selecione os 8 melhores para o estudo de "${materia}" (Tópico: ${topico}).
    
    Critérios de Seleção:
    1. Priorize aulas teóricas completas, cursos ou revisões didáticas.
    2. Ignore vídeos que sejam notícias, lives de análise de edital, fofocas ou propagandas curtas.
    3. Prefira canais conhecidos (Estratégia, Gran, Direção, Alfacon, etc) se estiverem na lista.
    4. Vídeos com títulos como "Aula 01", "Curso Completo", "Teoria" são prioridade.
    
    Lista de Vídeos:
    ${videos.map((v, i) => `${i}: TITULO: ${v.titulo} | CANAL: ${v.canal}`).join('\n')}
    
    Retorne APENAS um array JSON com os índices dos 8 melhores vídeos na ordem de relevância.
    Exemplo de retorno: [3, 0, 5, 2, 1, 8, 4, 7]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim().replace(/```json/g, "").replace(/```/g, "");
    const selectedIndices = JSON.parse(text);
    
    if (Array.isArray(selectedIndices)) {
        return selectedIndices.map(index => videos[index]).filter(Boolean);
    }
    return videos.slice(0, 8);
  } catch (error) {
    console.error("Erro ao ranquear vídeos no Gemini:", error);
    return videos.slice(0, 8);
  }
}

export type VideoAiNotes = {
  resumo: string;
  notas: Array<{
    timestamp: string;
    titulo: string;
    explicacao: string;
  }>;
  revisao_rapida: string[];
};

export async function generateVideoAiNotes(input: {
  titulo: string;
  materia: string;
  topico?: string;
  canal?: string;
  descricao?: string;
}): Promise<VideoAiNotes | null> {
  const prompt = `
    Aja como mentor de concursos públicos e gere AI Notes estruturadas para revisão rápida.

    Contexto do vídeo:
    - Título: ${input.titulo}
    - Matéria: ${input.materia}
    - Tópico do edital: ${input.topico || "Não informado"}
    - Canal: ${input.canal || "Não informado"}
    - Descrição: ${(input.descricao || "").substring(0, 2000)}

    Regras obrigatórias:
    1. Responda em Português do Brasil.
    2. Retorne APENAS JSON válido, sem markdown.
    3. Gere entre 5 e 8 blocos de notas com timestamps estimados em formato mm:ss.
    4. Os timestamps devem seguir ordem crescente e parecer sequência real de aula.
    5. A explicação de cada bloco deve ser clara e objetiva para revisão pré-prova.

    Formato exato de saída:
    {
      "resumo": "texto curto com visão geral",
      "notas": [
        { "timestamp": "00:00", "titulo": "...", "explicacao": "..." }
      ],
      "revisao_rapida": ["ponto 1", "ponto 2", "ponto 3"]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleanText = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanText);

    if (!parsed || !Array.isArray(parsed.notas)) {
      return null;
    }

    return parsed as VideoAiNotes;
  } catch (error) {
    console.error("Erro ao gerar AI Notes de vídeo:", error);
    return null;
  }
}

