# BFF — Fatos Aleatórios

Projeto acadêmico que demonstra o padrão **BFF (Backend for Frontend)**: todo o
consumo de APIs de terceiros acontece exclusivamente no backend (Node.js +
Express), que processa os dados e expõe endpoints próprios para um frontend
estático. O frontend nunca fala diretamente com as APIs externas.

O backend busca:
- uma piada aleatória do Chuck Norris, traduzida para português;
- um personagem aleatório de Rick and Morty;
- uma passagem bíblica aleatória, em português (tradução Almeida).

## Arquitetura

```
Navegador (public/)  --->  Backend Express (server.js)  --->  APIs externas
                              /api/chuck                     chucknorris.io
                              /api/rick                       mymemory.translated.net
                              /api/biblia                    rickandmortyapi.com
                                                              bible-api.com
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior (necessário para o `fetch`
  nativo usado no `server.js`).

## Como rodar

```bash
# 1. Instale as dependências
npm install

# 2. Inicie o servidor
npm start

# 3. Abra no navegador
# http://localhost:3000
```

O comando `npm run dev` também está disponível e reinicia o servidor
automaticamente a cada alteração em `server.js` (usa `node --watch`).

## Endpoints

| Método | Rota           | Descrição                                                              |
|--------|----------------|-------------------------------------------------------------------------|
| GET    | `/api/chuck`   | Piada aleatória do Chuck Norris, original (`piadaEn`) e traduzida (`piadaPt`) |
| GET    | `/api/rick`    | Personagem aleatório (ID 1–826) da API Rick and Morty                   |
| GET    | `/api/biblia`  | Passagem bíblica aleatória, já em português (tradução Almeida)          |

Todas as respostas incluem um campo `statusHttp` (`200` ou `500`), usado no
frontend para exibir a imagem de status correspondente via
[http.cat](https://http.cat).

## Estrutura de pastas

```
bff-fatos-curiosos/
├── package.json
├── server.js          # backend Express com os 3 endpoints
└── public/
    ├── index.html      # frontend com os 3 cards
    └── style.css       # dark mode + glassmorphism
```

## Deploy (link público)

O GitHub Pages não serve, pois só hospeda arquivos estáticos e este projeto
precisa do `server.js` rodando. Uma opção com plano gratuito é o
[Render](https://render.com):

1. Suba o repositório para o GitHub (veja a seção anterior).
2. Crie uma conta no Render e clique em **New > Web Service**, conectando o
   repositório.
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Finalize o deploy. O Render gera uma URL pública (`https://seu-app.onrender.com`).

No plano gratuito o serviço "dorme" após um tempo sem acesso; a primeira
requisição depois disso pode demorar de 30 a 60 segundos para responder.

## Projeto acadêmico

Feito para fins de estudo do padrão BFF; sem licença específica associada.
