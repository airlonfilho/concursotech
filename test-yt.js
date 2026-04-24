const ytSearch = require('yt-search');

async function test() {
    const q1 = "ENGENHARIA DE SOFTWARE Formas normais aula completa teoria concurso -noticias -live -analise -edital Estratégia Gran Direção Alfacon";
    const q2 = "ENGENHARIA DE SOFTWARE Formas normais aula completa concurso";
    
    console.log("Q1:");
    const r1 = await ytSearch(q1);
    console.log(r1.videos.length);
    
    console.log("Q2:");
    const r2 = await ytSearch(q2);
    console.log(r2.videos.length);
}

test();
