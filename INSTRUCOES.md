# 📋 Instruções de Uso - Sistema de Restaurante e Delivery

## 🎯 Funcionalidades Implementadas

✅ **Sistema completo de restaurante e delivery via WhatsApp**

### 1. Atendimento pelo WhatsApp
- Bot inteligente que responde automaticamente
- Comandos simples: `cardapio`, `pedido`, `mesa`, `endereco`, `status`
- Extração automática de endereços das conversas
- Processamento com IA para respostas naturais

### 2. Gestão de Mesas
- Criação e gerenciamento de mesas
- Status: Livre, Ocupada, Reservada, Manutenção
- Ocupação e liberação automática
- Interface web para visualização

### 3. Sistema de Pedidos
- **Numeração automática:**
  - `D000001` - Delivery
  - `M000001` - Mesa
  - `B000001` - Balcão
  - `R000001` - Retirada
- Status do pedido: Pendente, Confirmado, Preparando, Pronto, Entregue, Cancelado
- Cálculo automático de totais (subtotal, taxa de entrega, desconto)

### 4. Extração de Endereço
- Extrai automaticamente endereços das mensagens do WhatsApp
- Suporta formatos livres e estruturados
- Salva endereço na conversa para uso futuro
- Validação de endereço completo

### 5. Impressão de Tickets
- **Ticket de Cozinha** - Impresso automaticamente ao criar pedido
- **Ticket de Entrega** - Para pedidos de delivery com endereço completo
- **Ticket de Mesa** - Para pedidos no restaurante
- Suporte para impressoras USB e Network

## 🚀 Como Começar

### 1. Instalação

```bash
cd restaurante-delivery
npm install
```

### 2. Configuração

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:
- `MONGODB_URI` - URL do MongoDB
- `OPENAI_API_KEY` - Chave da OpenAI (para IA)
- `PROPRIETARIO_NUMERO` - Seu número WhatsApp (formato: 557196177635@c.us)
- Configurações de impressora

### 3. Setup Inicial

Execute o setup para criar mesas e produtos de exemplo:

```bash
npm run setup
# ou
node setup.js
```

Isso criará:
- 20 mesas (configurável)
- 8 produtos de exemplo

### 4. Iniciar o Sistema

```bash
npm start
```

### 5. Conectar WhatsApp

1. Acesse `http://localhost:3000`
2. Escaneie o QR Code exibido
3. Aguarde a conexão

### 6. Configurar Impressora

1. Na interface web, vá para a aba "Impressão"
2. Escolha o tipo (Network ou USB)
3. Configure IP/Porta (Network) ou Vendor/Product ID (USB)
4. Clique em "Conectar Impressora"
5. Teste a impressão

## 📱 Comandos do WhatsApp

Os clientes podem usar os seguintes comandos:

- `cardapio` ou `menu` - Ver cardápio completo
- `pedido` - Iniciar novo pedido
- `mesa` - Ver mesas disponíveis
- `endereco` - Informar endereço para entrega
- `status` - Ver status do pedido atual
- `ajuda` - Ver menu de ajuda

## 🖨️ Configuração da Impressora

### Impressora de Rede (Recomendado)

1. Configure no `.env`:
```
IMPRESSORA_TIPO=network
IMPRESSORA_IP=192.168.1.100
IMPRESSORA_PORTA=9100
```

2. Ou conecte via interface web na aba "Impressão"

### Impressora USB

1. Descubra Vendor ID e Product ID da impressora
2. Configure no `.env` ou via interface web

**Nota:** Para USB, pode ser necessário instalar drivers adicionais:
```bash
npm install escpos-usb
```

## 📡 API Endpoints

### Mesas
- `GET /api/mesas` - Listar todas
- `POST /api/mesas` - Criar nova
- `POST /api/mesas/:numero/ocupar` - Ocupar
- `POST /api/mesas/:numero/liberar` - Liberar

### Pedidos
- `GET /api/pedidos` - Listar todos
- `POST /api/pedidos` - Criar novo
- `PUT /api/pedidos/:id/status` - Atualizar status
- `POST /api/pedidos/:id/cancelar` - Cancelar

### Produtos
- `GET /api/produtos` - Listar todos
- `POST /api/produtos` - Criar novo
- `PUT /api/produtos/:id` - Atualizar
- `DELETE /api/produtos/:id` - Deletar

### Impressão
- `POST /api/impressao/conectar` - Conectar impressora
- `GET /api/impressao/status` - Status
- `POST /api/impressao/teste` - Teste
- `POST /api/impressao/pedido/:id/cozinha` - Imprimir cozinha
- `POST /api/impressao/pedido/:id/entrega` - Imprimir entrega
- `POST /api/impressao/pedido/:id/mesa` - Imprimir mesa

## 🔄 Fluxo de Pedido

1. **Cliente envia mensagem** no WhatsApp
2. **Bot responde** com opções (cardápio, pedido, etc.)
3. **Cliente escolhe tipo** de pedido (delivery, mesa, retirada)
4. **Bot solicita itens** e informações
5. **Endereço extraído** automaticamente (para delivery)
6. **Pedido criado** com número automático
7. **Ticket de cozinha impresso** automaticamente
8. **Pedido pode ser impresso** novamente (entrega/mesa) quando necessário

## 📝 Exemplo de Conversa

```
Cliente: Olá
Bot: 🍽️ Olá! Bem-vindo ao nosso restaurante!
     Como posso ajudar?
     - cardapio - Ver nosso cardápio
     - pedido - Fazer um pedido
     ...

Cliente: cardapio
Bot: [Mostra cardápio completo]

Cliente: pedido
Bot: Qual tipo de pedido?
     1. Delivery
     2. Mesa
     3. Retirada

Cliente: 1
Bot: [Solicita itens e endereço]

Cliente: Quero 2 pizzas margherita
        Endereço: Rua das Flores, 123, Centro, São Paulo - SP
Bot: [Extrai endereço automaticamente]
     [Cria pedido D000001]
     [Imprime ticket de cozinha]
     ✅ Pedido D000001 criado!
```

## 🛠️ Estrutura do Projeto

```
restaurante-delivery/
├── src/
│   ├── app.js                 # Aplicação principal
│   ├── config/                # Configurações
│   ├── models/                # Modelos MongoDB
│   │   ├── Mesa.js
│   │   ├── PedidoRestaurante.js
│   │   ├── Produto.js
│   │   └── Conversation.js
│   ├── routes/                # Rotas da API
│   ├── services/              # Serviços
│   │   ├── messageHandler.js
│   │   └── printService.js
│   └── utils/                 # Utilitários
│       ├── addressExtractor.js
│       └── logger.js
├── public/
│   └── index.html             # Interface web
├── package.json
├── setup.js                   # Script de setup
└── README.md
```

## ⚠️ Notas Importantes

1. **WhatsApp:** Use uma conta dedicada, pois o bot ficará logado
2. **MongoDB:** Certifique-se de que está rodando antes de iniciar
3. **Impressora:** Teste a conexão antes de usar em produção
4. **OpenAI:** Necessário para respostas inteligentes (opcional, mas recomendado)

## 🐛 Solução de Problemas

### WhatsApp não conecta
- Verifique se o QR Code foi escaneado
- Limpe a pasta `.wwebjs_auth/` e tente novamente
- Verifique a conexão com internet

### Impressora não imprime
- Verifique se está conectada (rede ou USB)
- Teste a impressão via interface web
- Verifique logs em `logs/error.log`

### Endereço não é extraído
- O sistema tenta extrair automaticamente
- Se falhar, o cliente pode informar manualmente
- Verifique o formato do endereço nas mensagens

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs em `logs/`
2. Consulte a documentação da API
3. Verifique as configurações no `.env`

---

**Desenvolvido com ❤️ para restaurantes e delivery**

