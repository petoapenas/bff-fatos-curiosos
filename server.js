// server.js
// Servidor BFF (Backend for Frontend) em Express.
// Todo o consumo de APIs de terceiros acontece SOMENTE aqui no backend.
// O frontend (public/) nunca fala diretamente com as APIs externas,
// apenas com os endpoints próprios expostos abaixo.

import express from "express";

const app = express();
const PORT = 3000;

// Serve os arquivos estáticos do frontend (index.html, style.css, etc.)
app.use(express.static("public"));

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

    // 2) Traduz a piada usando a API MyMemory
    const query = encodeURIComponent(piadaEn);
    const traducaoResponse = await fetch(
      `https://api.mymemory.translated.net/get?q=${query}&langpair=en|pt-br`
    );
    const traducaoData = await traducaoResponse.json();
    const piadaPt = traducaoData.responseData.translatedText;

    return res.status(200).json({
      statusHttp: 200,
      piadaPt,
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
