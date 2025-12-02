# Sistema de Restaurante e Delivery - WhatsApp

Sistema completo de atendimento via WhatsApp para restaurantes com gestão de mesas, pedidos e impressão automática de tickets.

## 🚀 Funcionalidades

- ✅ **Atendimento via WhatsApp** - Bot inteligente para receber pedidos
- ✅ **Gestão de Mesas** - Controle de mesas do restaurante
- ✅ **Pedidos Automáticos** - Número automático de pedidos (D para delivery, M para mesa, B para balcão, R para retirada)
- ✅ **Extração de Endereço** - Extrai automaticamente endereços das conversas do WhatsApp
- ✅ **Impressão de Tickets** - Impressão automática de tickets para:
  - 🍳 Cozinha (quando pedido é criado)
  - 🚚 Entrega (para pedidos de delivery)
  - 🪑 Mesa (para pedidos no restaurante)
- ✅ **API REST** - API completa para integração
- ✅ **Interface Web** - Painel administrativo (em desenvolvimento)

## 📋 Pré-requisitos

- Node.js 16+ 
- MongoDB
- Impressora térmica (USB ou Network)
- Conta WhatsApp Business (ou WhatsApp pessoal)

## 🔧 Instalação

1. Clone o repositório ou copie a pasta `restaurante-delivery`

2. Instale as dependências:
```bash
cd restaurante-delivery
npm install
```

3. Configure as variáveis de ambiente:
```bash
# Crie o arquivo .env na pasta restaurante-delivery
# Veja o arquivo SEPARACAO_SISTEMAS.md para o conteúdo completo do .env
# Ou copie o exemplo abaixo e ajuste conforme necessário
```

**⚠️ Importante**: Este sistema é independente e deve ter seu próprio arquivo `.env`. Veja `SEPARACAO_SISTEMAS.md` para mais detalhes sobre a separação dos sistemas.

4. Inicie o MongoDB (se não estiver rodando):
```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongod
```

5. Inicie o servidor:
```bash
npm start
```

6. Escaneie o QR Code que aparecerá no terminal ou acesse `http://localhost:3001` (ou a porta configurada no .env) para ver o QR Code

**Nota**: Por padrão, o sistema usa a porta 3001 para evitar conflito com o sistema principal (porta 3000). Configure a porta no arquivo `.env` se necessário.

## 📱 Comandos do WhatsApp

O bot responde aos seguintes comandos:

- `cardapio` ou `menu` - Ver o cardápio completo
- `pedido` - Iniciar um novo pedido
- `mesa` - Verificar mesas disponíveis
- `endereco` - Informar endereço para entrega
- `status` - Ver status do pedido atual
- `ajuda` - Ver menu de ajuda

## 🖨️ Configuração da Impressora

### Impressora de Rede (Network)

1. Configure no arquivo `.env`:
```
IMPRESSORA_TIPO=network
IMPRESSORA_IP=192.168.1.100
IMPRESSORA_PORTA=9100
```

2. Conecte via API:
```bash
POST /api/impressao/conectar
{
  "tipo": "network",
  "ip": "192.168.1.100",
  "porta": 9100
}
```

### Impressora USB

1. Descubra o vendorId e productId da impressora
2. Configure no arquivo `.env`:
```
IMPRESSORA_TIPO=usb
IMPRESSORA_USB_VENDOR_ID=0x04f9
IMPRESSORA_USB_PRODUCT_ID=0x2042
```

3. Conecte via API:
```bash
POST /api/impressao/conectar
{
  "tipo": "usb",
  "vendorId": "0x04f9",
  "productId": "0x2042"
}
```

## 📡 API Endpoints

### Mesas
- `GET /api/mesas` - Listar todas as mesas
- `GET /api/mesas/:numero` - Obter mesa específica
- `POST /api/mesas` - Criar nova mesa
- `POST /api/mesas/:numero/ocupar` - Ocupar mesa
- `POST /api/mesas/:numero/liberar` - Liberar mesa
- `POST /api/mesas/:numero/reservar` - Reservar mesa

### Pedidos
- `GET /api/pedidos` - Listar pedidos
- `GET /api/pedidos/:id` - Obter pedido específico
- `POST /api/pedidos` - Criar novo pedido
- `PUT /api/pedidos/:id/status` - Atualizar status
- `POST /api/pedidos/:id/cancelar` - Cancelar pedido

### Produtos
- `GET /api/produtos` - Listar produtos
- `POST /api/produtos` - Criar produto
- `PUT /api/produtos/:id` - Atualizar produto
- `DELETE /api/produtos/:id` - Deletar produto

### Impressão
- `POST /api/impressao/conectar` - Conectar impressora
- `GET /api/impressao/status` - Status da impressora
- `POST /api/impressao/teste` - Teste de impressão
- `POST /api/impressao/pedido/:id/cozinha` - Imprimir ticket de cozinha
- `POST /api/impressao/pedido/:id/entrega` - Imprimir ticket de entrega
- `POST /api/impressao/pedido/:id/mesa` - Imprimir ticket de mesa

## 🗄️ Estrutura do Banco de Dados

### Modelos Principais

- **Mesa** - Gestão de mesas do restaurante
- **PedidoRestaurante** - Pedidos com numeração automática
- **Produto** - Cardápio do restaurante
- **Conversation** - Histórico de conversas com extração de endereço

## 🔄 Fluxo de Pedidos

1. Cliente envia mensagem no WhatsApp
2. Bot processa e oferece opções (cardápio, pedido, etc.)
3. Cliente escolhe tipo de pedido (delivery, mesa, retirada)
4. Bot solicita itens e informações necessárias
5. Endereço é extraído automaticamente das mensagens (para delivery)
6. Pedido é criado com número automático
7. Ticket de cozinha é impresso automaticamente
8. Pedido pode ser impresso novamente (entrega/mesa) quando necessário

## 📝 Notas

- Os pedidos recebem numeração automática:
  - `D000001` - Delivery
  - `M000001` - Mesa
  - `B000001` - Balcão
  - `R000001` - Retirada

- Endereços são extraídos automaticamente das conversas usando padrões de texto

- Tickets são impressos automaticamente na cozinha quando um pedido é criado

## 🛠️ Desenvolvimento

```bash
# Modo desenvolvimento com auto-reload
npm run dev

# Testes
npm test
```

## 📄 Licença

ISC

## 👨‍💻 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

