# 🔀 Separação dos Sistemas

Este documento explica como os sistemas foram separados para funcionarem de forma independente.

## 📁 Estrutura dos Sistemas

### Sistema Principal (Raiz do Projeto)
- **Localização**: `C:\Users\contr\BotSwichtWhat_k_v_V1.0\`
- **Nome**: `kv-tecnologia-whatsapp-bot`
- **Porta**: `3000`
- **Banco de Dados**: `mongodb://localhost:27017/kv-tecnologia-bot`
- **Descrição**: Sistema completo de PDV/Vendas com admin, vendedor, produtos, clientes, tickets, etc.

### Sistema Restaurante-Delivery
- **Localização**: `C:\Users\contr\BotSwichtWhat_k_v_V1.0\restaurante-delivery\`
- **Nome**: `restaurante-delivery-whatsapp`
- **Porta**: `3001` (recomendado) ou `3000` (se o sistema principal não estiver rodando)
- **Banco de Dados**: `mongodb://localhost:27017/restaurante-delivery`
- **Descrição**: Sistema específico para restaurantes com gestão de mesas, pedidos de delivery e impressão de tickets

## 🔧 Configuração Independente

### Arquivo .env Separado

Cada sistema deve ter seu próprio arquivo `.env`:

#### Sistema Principal
- **Arquivo**: `.env` (na raiz do projeto)
- **Exemplo**: `env.example` (na raiz)

#### Sistema Restaurante-Delivery
- **Arquivo**: `restaurante-delivery/.env`
- **Exemplo**: Criar manualmente baseado nas variáveis abaixo

### Variáveis de Ambiente do Restaurante-Delivery

Crie o arquivo `restaurante-delivery/.env` com o seguinte conteúdo:

```env
# Configurações do Sistema de Restaurante e Delivery
NODE_ENV=development
PORT=3001

# MongoDB - Use um banco de dados separado
MONGODB_URI=mongodb://localhost:27017/restaurante-delivery

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenAI
OPENAI_API_KEY=sua_chave_api_openai_aqui
AI_MODEL=gpt-3.5-turbo
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=500

# WhatsApp
PROPRIETARIO_NUMERO=557196177635@c.us
BOT_NAME=Assistente do Restaurante

# Configurações do Restaurante
RESTAURANTE_NOME=Restaurante
RESTAURANTE_DESCRICAO=Sabor e qualidade em cada prato
RESTAURANTE_CNPJ=00.000.000/0001-00
RESTAURANTE_ENDERECO=Rua Principal, 123 - Centro
RESTAURANTE_CIDADE=São Paulo - SP
RESTAURANTE_TELEFONE=(11) 99999-9999
RESTAURANTE_EMAIL=contato@restaurante.com.br

# Horário de Funcionamento
HORARIO_SEGUNDA_SEXTA=11:00 - 23:00
HORARIO_SABADO=11:00 - 00:00
HORARIO_DOMINGO=11:00 - 22:00

# Configurações de Delivery
TAXA_ENTREGA_PADRAO=5.00
TEMPO_ENTREGA_ESTIMADO=30
RAIO_ENTREGA=10

# Configurações de Mesas
NUMERO_MESAS=20
CAPACIDADE_MESA_PADRAO=4

# Configurações de Impressora
IMPRESSORA_TIPO=network
IMPRESSORA_IP=192.168.1.100
IMPRESSORA_PORTA=9100
IMPRESSORA_USB_VENDOR_ID=
IMPRESSORA_USB_PRODUCT_ID=

# Logs
LOG_FILE_PATH=logs/app.log
```

## 🚀 Como Executar os Sistemas Separadamente

### Executar Sistema Principal

```bash
# Na raiz do projeto
cd C:\Users\contr\BotSwichtWhat_k_v_V1.0
npm install
npm start
# Acesse: http://localhost:3000
```

### Executar Sistema Restaurante-Delivery

```bash
# Na pasta do restaurante-delivery
cd C:\Users\contr\BotSwichtWhat_k_v_V1.0\restaurante-delivery
npm install
# Crie o arquivo .env (veja acima)
npm start
# Acesse: http://localhost:3001
```

### Executar Ambos Simultaneamente

Você pode executar ambos os sistemas ao mesmo tempo usando portas diferentes:

1. **Terminal 1** - Sistema Principal:
```bash
cd C:\Users\contr\BotSwichtWhat_k_v_V1.0
npm start
# Rodando na porta 3000
```

2. **Terminal 2** - Sistema Restaurante-Delivery:
```bash
cd C:\Users\contr\BotSwichtWhat_k_v_V1.0\restaurante-delivery
npm start
# Rodando na porta 3001
```

## 📂 Estrutura de Diretórios Independentes

### Sistema Principal
```
BotSwichtWhat_k_v_V1.0/
├── src/              # Código fonte principal
├── models/           # Modelos do sistema principal
├── routes/           # Rotas do sistema principal
├── public/           # Interface web principal
├── .env              # Configurações do sistema principal
├── package.json      # Dependências do sistema principal
└── app.js            # Entry point do sistema principal
```

### Sistema Restaurante-Delivery
```
restaurante-delivery/
├── src/              # Código fonte do restaurante
│   ├── config/       # Configurações (usa .env local)
│   ├── models/       # Modelos do restaurante
│   ├── routes/       # Rotas do restaurante
│   ├── services/     # Serviços do restaurante
│   └── utils/        # Utilitários do restaurante
├── public/           # Interface web do restaurante
├── logs/             # Logs do restaurante (criado automaticamente)
├── .env              # Configurações do restaurante (criar manualmente)
├── package.json      # Dependências do restaurante
└── setup.js          # Script de setup do restaurante
```

## 🔐 Banco de Dados Separados

Cada sistema usa seu próprio banco de dados MongoDB:

- **Sistema Principal**: `kv-tecnologia-bot`
- **Sistema Restaurante**: `restaurante-delivery`

Isso garante que os dados não se misturem e cada sistema pode ser gerenciado independentemente.

## 📝 Logs Separados

Cada sistema mantém seus próprios logs:

- **Sistema Principal**: `logs/` (na raiz)
- **Sistema Restaurante**: `restaurante-delivery/logs/`

## ⚠️ Importante

1. **Portas Diferentes**: Se executar ambos simultaneamente, use portas diferentes (3000 e 3001)

2. **WhatsApp**: Cada sistema precisa de uma conta WhatsApp diferente ou você pode usar o mesmo número, mas apenas um sistema pode estar conectado por vez

3. **MongoDB**: Ambos os sistemas podem usar o mesmo servidor MongoDB, mas com bancos de dados diferentes

4. **Dependências**: Cada sistema tem seu próprio `package.json` e `node_modules`, então instale as dependências em cada pasta separadamente

## 🔄 Migração/Deploy

Para mover o sistema restaurante-delivery para outro servidor:

1. Copie toda a pasta `restaurante-delivery/`
2. Crie o arquivo `.env` com as configurações corretas
3. Execute `npm install` dentro da pasta
4. Execute `npm start`

O sistema é completamente independente e não precisa do sistema principal para funcionar.

