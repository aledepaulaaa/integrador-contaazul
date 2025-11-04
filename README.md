# 🚀 Integrador Conta Azul  
> Aplicação simples para integração com a API da :contentReference[oaicite:0]{index=0} — filtragem, busca e persistência local de dados (sem banco, usando JSON).  
> Desenvolvido por **Alexandre**.

---

## 🎯 Visão Geral  
Esta aplicação permite conectar-se à Conta Azul via OAuth2, buscar entidades como vendas, pessoas, produtos, notas fiscais e cobranças, e salvar os resultados localmente em arquivos JSON por tipo e período. Pode servir como base para escalar e construir integrações mais robustas.

### 🔧 Principais Features  
- Autenticação OAuth2 com Conta Azul (login / desconectar)  
- Persistência de sessão (tokens) em `data/auth/session.json`  
- Endpoints REST para:  
  - `/api/vendas` → busca vendas  
  - `/api/pessoas` → busca pessoas  
  - `/api/produtos` → busca produtos  
  - `/api/notas` → busca notas fiscais  
  - `/api/cobrancas` → busca cobranças  
- Histórico local de consultas via `/api/historico`, com leitura/exclusão de JSONs  
- Front-end responsivo com Bootstrap 5 + estilo glassmorphism  
- Filtros de data (data início / data fim) + seleção de entidade no painel  
- Arquitetura organizada (MVC-lite): controllers, routes, models (jsonManager), utils  
- Preparado para ambiente de teste, fácil migração para VPS ou serviço de hosting (ex. Render)  

---

## 🧱 Estrutura do Projeto  
```bash
integrador-contaazul/
│
├── src/
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ ├── utils/
│ └── views/
│
├── public/
│ ├── css/
│ └── js/
│
├── data/ ← arquivos JSON salvos
│ ├── auth/
│ ├── vendas/
│ ├── pessoas/
│ ├── produtos/
│ ├── notas_fiscais/
│ └── cobrancas/
│
├── .env ← variáveis de ambiente
├── server.js ← ponto de entrada
└── package.json
```


---

## 🧑‍💻 Como Rodar Localmente  
1. Clone o repositório  
   ```bash
   git clone https://github.com/aledepaulaaa/integrador-contaazul.git
   cd integrador-contaazul


2. Instale dependências

npm install

3. Copie o .env.example para .env e configure:

PORT=7575  
CLIENT_ID=…  
CLIENT_SECRET=…  
REDIRECT_URI=http://localhost:7575/auth/callback  
AUTH_AUTHORIZE_URL=https://auth.contaazul.com/oauth2/authorize  
AUTH_TOKEN_URL=https://auth.contaazul.com/oauth2/token  
API_BASE_URL=https://api.contaazul.com  

4. Inicie o servidor em modo de desenvolvimento

npm run dev

5. Acesse no navegador: http://localhost:7575

6. Clique em Autenticar Conta Azul, realize o login, e depois explore os filtros e endpoints no dashboard.

✔️ Como Funciona

Ao clicar em Autenticar Conta Azul, você é redirecionado ao fluxo OAuth2.

Após login, o código é trocado por access_token + refresh_token, que são salvos em data/auth/session.json.

No front-end você escolhe entidade (vendas/pessoas/produtos/notas/cobranças), define período e clica em Filtrar.

O backend chama a API da Conta Azul, obtém os dados, salva no diretório correspondente como JSON (ex: data/vendas/UUID.json) e retorna o resultado para o front-end.

Você pode ver o histórico de buscas executadas em /api/historico, e remover qualquer arquivo JSON via rota DELETE.

🧩 Para Desenvolvedores que Vão Escalar

✅ Banco de dados real: substituir o mecanismo de JSON por banco SQL/NoSQL

✅ Paginação / Más filtros: adicionar tratamento de paginação da API da Conta Azul

✅ Token refresh automático: já iniciado, pode ser expandido com alerta de token expirando

✅ Logs e monitoramento: adicionar middleware de logs, integração com Sentry ou similar

✅ Interface aprimorada: usar componente de calendário (ex: flatpickr), gráficos, dashboards interativos

✅ Camada de cache/filtragem: evitar múltiplas requisições iguais, usar Redis ou similar

✅ Estrutura modular: separar serviços da Conta Azul em módulos bem definidos, testes unitários/mocks

🚀 Deploy (Render/VPS)

Configure o build command: npm install && npm run build? (se houver build)

Configure o start command: npm run start

Variável de ambiente NODE_ENV=production

Assegure que o REDIRECT_URI para produção seja algo como https://your-domain.com/auth/callback e esteja registrado no painel da Conta Azul

Ajuste diretórios de dados se for usar persistência permanente ou banco de dados

📚 Referências

Documentação oficial da Conta Azul Developers: https://developers.contaazul.com/guide

OAuth2 na Conta Azul: https://developers.contaazul.com/quick-start

Pacote express-ejs-layouts: https://www.npmjs.com/package/express-ejs-layouts

📝 Licença


MIT © 2025 Alexandre

