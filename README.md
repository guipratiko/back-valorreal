# ValorReal Backend

Backend para consulta de valor de mercado de veículos utilizando a API Placas.

## 🚀 Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente no arquivo `.env`:
```env
API_TOKEN=seu_token_aqui
MONGO_URI=sua_uri_mongodb
DB_NAME=valorreal
PORT=3000
```

## 📡 Endpoints

### Consulta de Veículo
```
GET /api/consulta/:placa
```
Consulta o valor de mercado de um veículo pela placa. Retorna dados do cache se a consulta foi feita nas últimas 24 horas.

**Exemplo:**
```bash
curl http://localhost:3000/api/consulta/ABC1234
```

### Forçar Nova Consulta
```
GET /api/consulta/:placa/forcar
```
Força uma nova consulta na API, ignorando o cache.

### Histórico de Consultas
```
GET /api/consulta/:placa/historico?limit=10&page=1
```
Lista o histórico de consultas de uma placa específica.

### Listar Todas as Consultas
```
GET /api/consultas?limit=20&page=1&placa=ABC1234
```
Lista todas as consultas realizadas, com opção de filtrar por placa.

### Estatísticas
```
GET /api/estatisticas
```
Retorna estatísticas gerais do sistema.

### Health Check
```
GET /health
```
Verifica se o servidor está funcionando.

## 🏃 Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

## 📋 Formato de Placa

A API aceita placas nos formatos:
- **Antigo:** AAA9999 (3 letras + 4 números)
- **Novo:** AAA0X00 (3 letras + 1 número + 1 letra + 2 números)

## 🔒 Segurança

- Nunca exponha o token da API ou credenciais do banco de dados
- Use variáveis de ambiente para informações sensíveis
- O arquivo `.env` está no `.gitignore` por padrão

## 📦 Estrutura do Projeto

```
ValorRealAPP/
├── server.js              # Servidor principal
├── routes/                # Rotas da API
│   └── consulta.js
├── controllers/           # Controllers
│   └── consultaController.js
├── models/                # Modelos MongoDB
│   └── Vehicle.js
├── services/              # Serviços externos
│   └── apiPlacasService.js
├── .env                   # Variáveis de ambiente
└── package.json
```

# back-valorreal
