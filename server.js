// server.js
// Servidor BFF (Backend for Frontend) em Express.
// Todo o consumo de APIs de terceiros acontece SOMENTE aqui no backend.
// O frontend (public/) nunca fala diretamente com as APIs externas,
// apenas com os endpoints próprios expostos abaixo.

import express from "express";

const app = express();
// Serviços de hospedagem (Render, Railway, etc.) definem a porta através da
// variável de ambiente PORT. Localmente, sem essa variável, cai no 3000.
const PORT = process.env.PORT || 3000;

// Serve os arquivos estáticos do frontend (index.html, style.css, etc.)
app.use(express.static("public"));

// Cache simples em memória: se a mesma piada (o catálogo do Chuck Norris é
// finito) já foi traduzida antes, reaproveita o resultado em vez de gastar
// cota da API de tradução de novo. Zera quando o servidor reinicia.
const cacheTraducoes = new Map();

// Opcional: um e-mail válido multiplica por 10 o limite diário gratuito da
// MyMemory (de 5.000 para 50.000 caracteres/dia) — é a própria MyMemory que
// recomenda isso. Configure a variável de ambiente MYMEMORY_EMAIL (no Render:
// aba Environment) com o seu e-mail para ativar. Sem ela, tudo continua
// funcionando, só que com o limite menor.
const EMAIL_MYMEMORY = process.env.MYMEMORY_EMAIL;

// Traduz um texto para português usando a MyMemory, tratando corretamente o
// caso em que a cota diária acabou. Retorna null quando não foi possível
// traduzir (nunca retorna o aviso de erro da MyMemory como se fosse texto
// traduzido).
async function traduzirParaPortugues(texto) {
  if (cacheTraducoes.has(texto)) {
    return cacheTraducoes.get(texto);
  }

  try {
    let url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=en|pt-br`;
    if (EMAIL_MYMEMORY) {
      url += `&de=${encodeURIComponent(EMAIL_MYMEMORY)}`;
    }

    const resposta = await fetch(url);
    const dados = await resposta.json();

    // A MyMemory devolve HTTP 200 mesmo quando a cota diária acabou; o aviso
    // vem dentro de "translatedText". Por isso checamos "responseStatus" e
    // "quotaFinished" antes de confiar no texto traduzido.
    const cotaEsgotada = dados.responseStatus !== 200 || dados.quotaFinished === true;
    if (cotaEsgotada) {
      return null;
    }

    const traducao = dados.responseData.translatedText;
    cacheTraducoes.set(texto, traducao);
    return traducao;
  } catch (erro) {
    // Qualquer falha na tradução (rede, MyMemory fora do ar, JSON inválido)
    // não deve derrubar o endpoint inteiro — a piada em inglês ainda pode
    // ser exibida.
    console.error("Erro ao traduzir:", erro.message);
    return null;
  }
}

// -----------------------------------------------------------------------
// Endpoint A: GET /api/chuck
// Busca uma piada aleatória do Chuck Norris (em inglês) e traduz para PT-BR.
// -----------------------------------------------------------------------
app.get("/api/chuck", async (req, res) => {
  try {
    // 1) Busca a piada original em inglês
    const chuckResponse = await fetch("https://api.chucknorris.io/jokes/random");
    const chuckData = await chuckResponse.json();
    const piadaEn = chuckData.value;

    // 2) Traduz a piada (com cache e tratamento de cota esgotada)
    const piadaPt = await traduzirParaPortugues(piadaEn);

    return res.status(200).json({
      statusHttp: 200,
      piadaPt:
        piadaPt ??
        "Tradução indisponível no momento (limite diário do serviço de tradução foi atingido). Aqui está a piada original:",
      piadaEn,
    });
  } catch (erro) {
    console.error("Erro em /api/chuck:", erro.message);
    return res.status(500).json({ statusHttp: 500 });
  }
});

// -----------------------------------------------------------------------
// Endpoint B: GET /api/rick
// Sorteia um ID de 1 a 826 e busca o personagem correspondente na API
// Rick and Morty.
// -----------------------------------------------------------------------
app.get("/api/rick", async (req, res) => {
  try {
    const idAleatorio = Math.floor(Math.random() * 826) + 1;

    const rickResponse = await fetch(
      `https://rickandmortyapi.com/api/character/${idAleatorio}`
    );

    // A API retorna 404 para IDs inexistentes; tratamos isso como erro.
    if (!rickResponse.ok) {
      throw new Error(`Rick and Morty API retornou status ${rickResponse.status}`);
    }

    const rickData = await rickResponse.json();

    return res.status(200).json({
      statusHttp: 200,
      nome: rickData.name,
      especie: rickData.species,
      status: rickData.status,
      imagem: rickData.image,
    });
  } catch (erro) {
    console.error("Erro em /api/rick:", erro.message);
    return res.status(500).json({ statusHttp: 500 });
  }
});

// -----------------------------------------------------------------------
// Endpoint C: GET /api/biblia
// Sorteia uma passagem bíblica de uma lista pré-definida e busca o texto
// na API bible-api.com.
//
// A referência da passagem (ex: "john 3:16") continua em inglês porque é
// assim que a bible-api.com identifica o livro/capítulo/versículo na URL,
// mas o parâmetro "translation=almeida" faz o TEXTO retornar em português,
// na tradução de João Ferreira de Almeida.
// -----------------------------------------------------------------------
const PASSAGENS_BIBLICAS = [
  "john 3:16",
  "psalms 23",
  "genesis 1:1",
  "romans 8:28",
  "proverbs 3:5-6",
  "philippians 4:13",
  "matthew 6:33",
];

const TRADUCAO_BIBLIA = "almeida"; // João Ferreira de Almeida (PT)

app.get("/api/biblia", async (req, res) => {
  try {
    const passagemSorteada =
      PASSAGENS_BIBLICAS[Math.floor(Math.random() * PASSAGENS_BIBLICAS.length)];

    const bibliaResponse = await fetch(
      `https://bible-api.com/${encodeURIComponent(passagemSorteada)}?translation=${TRADUCAO_BIBLIA}`
    );

    if (!bibliaResponse.ok) {
      throw new Error(`bible-api.com retornou status ${bibliaResponse.status}`);
    }

    const bibliaData = await bibliaResponse.json();

    return res.status(200).json({
      statusHttp: 200,
      texto: bibliaData.text.trim(),
      referencia: bibliaData.reference,
    });
  } catch (erro) {
    console.error("Erro em /api/biblia:", erro.message);
    return res.status(500).json({ statusHttp: 500 });
  }
});

// -----------------------------------------------------------------------
// Inicialização do servidor
// -----------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Servidor BFF rodando em http://localhost:${PORT}`);
});
