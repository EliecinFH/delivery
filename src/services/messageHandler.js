const logger = require('../utils/logger');
const openai = require('../config/openai');
const Conversation = require('../models/Conversation');
const PedidoRestaurante = require('../models/PedidoRestaurante');
const Produto = require('../models/Produto');
const Mesa = require('../models/Mesa');
const addressExtractor = require('../utils/addressExtractor');

class MessageHandler {
    constructor() {
        this.defaultResponse = "🍽️ *Olá! Bem-vindo ao nosso restaurante!*\n\n" +
            "Como posso ajudar?\n\n" +
            "📋 *Comandos disponíveis:*\n" +
            "- *cardapio* - Ver nosso cardápio\n" +
            "- *pedido* - Fazer um pedido\n" +
            "- *mesa* - Verificar disponibilidade de mesas\n" +
            "- *endereco* - Informar endereço para entrega\n" +
            "- *status* - Ver status do seu pedido\n" +
            "- *ajuda* - Ver este menu novamente";
    }

    async handleMessage(message, client) {
        try {
            const userId = message.from;
            const messageContent = message.body.trim().toLowerCase();

            // Salvar mensagem na conversa
            await this.saveToConversation(userId, messageContent, 'user');

            // Verificar se é um comando
            if (this.isCommand(messageContent)) {
                await this.handleCommand(message, messageContent, client);
                return;
            }

            // Verificar se está em um fluxo de pedido
            const pedidoAtivo = await this.getPedidoAtivo(userId);
            if (pedidoAtivo) {
                await this.handlePedidoFlow(message, messageContent, pedidoAtivo, client);
                return;
            }

            // Processar com IA para resposta natural
            const aiResponse = await this.processWithAI(messageContent, userId);
            await this.saveToConversation(userId, aiResponse, 'bot');
            await message.reply(aiResponse);

            // Enviar menu após resposta
            setTimeout(async () => {
                await client.sendMessage(userId, this.defaultResponse);
            }, 2000);

        } catch (error) {
            logger.error('Erro ao processar mensagem:', error);
            await message.reply('Desculpe, ocorreu um erro. Como posso ajudar?');
        }
    }

    async handleCommand(message, command, client) {
        const userId = message.from;

        switch (command) {
            case 'cardapio':
            case 'cardápio':
            case 'menu':
                await this.showCardapio(message, client);
                break;

            case 'pedido':
            case 'fazer pedido':
            case 'novo pedido':
                await this.iniciarPedido(message, client);
                break;

            case 'mesa':
            case 'mesas':
            case 'verificar mesa':
                await this.showMesasDisponiveis(message, client);
                break;

            case 'endereco':
            case 'endereço':
            case 'informar endereco':
                await this.solicitarEndereco(message, client);
                break;

            case 'status':
            case 'meu pedido':
            case 'pedido atual':
                await this.showStatusPedido(message, client);
                break;

            case 'ajuda':
            case 'help':
            case 'comandos':
                await message.reply(this.defaultResponse);
                break;

            default:
                await message.reply('Comando não reconhecido. Digite *ajuda* para ver os comandos disponíveis.');
        }
    }

    async showCardapio(message, client) {
        try {
            const produtos = await Produto.find({ disponivel: true })
                .sort({ categoria: 1, nome: 1 });

            if (produtos.length === 0) {
                await message.reply('📋 Desculpe, nosso cardápio está temporariamente indisponível.');
                return;
            }

            let cardapio = "🍽️ *NOSSO CARDÁPIO*\n\n";

            const categorias = {};
            produtos.forEach(produto => {
                if (!categorias[produto.categoria]) {
                    categorias[produto.categoria] = [];
                }
                categorias[produto.categoria].push(produto);
            });

            const categoriaNames = {
                'entrada': '🥗 ENTRADAS',
                'prato_principal': '🍛 PRATOS PRINCIPAIS',
                'bebida': '🥤 BEBIDAS',
                'sobremesa': '🍰 SOBREMESAS',
                'lanche': '🍔 LANCHES',
                'pizza': '🍕 PIZZAS',
                'outros': '📦 OUTROS'
            };

            for (const [categoria, items] of Object.entries(categorias)) {
                cardapio += `${categoriaNames[categoria] || categoria.toUpperCase()}\n`;
                cardapio += "─".repeat(20) + "\n";

                items.forEach((produto, index) => {
                    cardapio += `${index + 1}. *${produto.nome}*\n`;
                    cardapio += `   💰 R$ ${produto.preco.toFixed(2)}\n`;
                    if (produto.descricao) {
                        cardapio += `   📝 ${produto.descricao}\n`;
                    }
                    cardapio += "\n";
                });
            }

            cardapio += "\n📝 *Para fazer um pedido, digite:*\n";
            cardapio += "   *pedido* ou o nome do produto\n\n";
            cardapio += "💬 *Exemplo:*\n";
            cardapio += "   \"Quero 2 pizzas margherita\"\n";
            cardapio += "   ou\n";
            cardapio += "   \"pedido\" para iniciar o assistente";

            await message.reply(cardapio);
        } catch (error) {
            logger.error('Erro ao mostrar cardápio:', error);
            await message.reply('Desculpe, ocorreu um erro ao carregar o cardápio.');
        }
    }

    async iniciarPedido(message, client) {
        try {
            const userId = message.from;

            // Verificar se já existe pedido ativo
            const pedidoAtivo = await PedidoRestaurante.findOne({
                'cliente.telefone': userId,
                status: { $in: ['pendente', 'confirmado', 'preparando'] }
            });

            if (pedidoAtivo) {
                await message.reply(
                    `Você já tem um pedido ativo: *${pedidoAtivo.numeroPedido}*\n\n` +
                    `Digite *status* para ver os detalhes.`
                );
                return;
            }

            // Perguntar tipo de pedido
            const resposta = "🍽️ *NOVO PEDIDO*\n\n" +
                "Qual tipo de pedido você deseja?\n\n" +
                "1️⃣ *Delivery* - Entrega em casa\n" +
                "2️⃣ *Mesa* - Comer no restaurante\n" +
                "3️⃣ *Retirada* - Buscar no balcão\n\n" +
                "Digite o número ou o nome da opção:";

            await message.reply(resposta);
            await this.saveToConversation(userId, 'aguardando_tipo_pedido', 'bot');

        } catch (error) {
            logger.error('Erro ao iniciar pedido:', error);
            await message.reply('Desculpe, ocorreu um erro ao iniciar o pedido.');
        }
    }

    async handlePedidoFlow(message, messageContent, pedido, client) {
        // Implementar fluxo de criação de pedido
        // Isso será expandido conforme necessário
        await message.reply('Processando seu pedido...');
    }

    async showMesasDisponiveis(message, client) {
        try {
            const mesasLivres = await Mesa.find({ status: 'livre' })
                .sort({ numero: 1 });

            if (mesasLivres.length === 0) {
                await message.reply('😔 Desculpe, não temos mesas disponíveis no momento.');
                return;
            }

            let resposta = "🪑 *MESAS DISPONÍVEIS*\n\n";
            mesasLivres.forEach(mesa => {
                resposta += `Mesa ${mesa.numero} - Capacidade: ${mesa.capacidade} pessoas\n`;
            });

            resposta += "\n💬 *Para reservar uma mesa, digite:*\n";
            resposta += "   \"Reservar mesa X\" ou \"Quero a mesa X\"";

            await message.reply(resposta);
        } catch (error) {
            logger.error('Erro ao mostrar mesas:', error);
            await message.reply('Desculpe, ocorreu um erro ao verificar as mesas.');
        }
    }

    async solicitarEndereco(message, client) {
        try {
            const resposta = "📍 *INFORME SEU ENDEREÇO*\n\n" +
                "Por favor, envie seu endereço completo no seguinte formato:\n\n" +
                "Rua/Avenida, Número\n" +
                "Complemento (opcional)\n" +
                "Bairro\n" +
                "Cidade - Estado\n" +
                "CEP (opcional)\n" +
                "Referência (opcional)\n\n" +
                "*Exemplo:*\n" +
                "Rua das Flores, 123\n" +
                "Apto 45\n" +
                "Centro\n" +
                "São Paulo - SP\n" +
                "01234-567\n" +
                "Próximo ao mercado";

            await message.reply(resposta);
        } catch (error) {
            logger.error('Erro ao solicitar endereço:', error);
        }
    }

    async showStatusPedido(message, client) {
        try {
            const userId = message.from;
            const pedido = await PedidoRestaurante.findOne({
                'cliente.telefone': userId,
                status: { $in: ['pendente', 'confirmado', 'preparando', 'pronto'] }
            }).populate('mesa');

            if (!pedido) {
                await message.reply('Você não tem pedidos ativos no momento.');
                return;
            }

            const statusNames = {
                'pendente': '⏳ Pendente',
                'confirmado': '✅ Confirmado',
                'preparando': '👨‍🍳 Preparando',
                'pronto': '✅ Pronto',
                'entregue': '🚚 Entregue',
                'cancelado': '❌ Cancelado'
            };

            let resposta = `📦 *PEDIDO ${pedido.numeroPedido}*\n\n`;
            resposta += `Status: ${statusNames[pedido.status] || pedido.status}\n`;
            resposta += `Tipo: ${pedido.tipoPedido.toUpperCase()}\n\n`;

            if (pedido.mesa) {
                resposta += `Mesa: ${pedido.mesa.numero}\n\n`;
            }

            resposta += "*ITENS:*\n";
            pedido.itens.forEach((item, index) => {
                resposta += `${index + 1}. ${item.nome} - ${item.quantidade}x\n`;
            });

            resposta += `\n💰 *Total: R$ ${pedido.total.toFixed(2)}*\n`;
            resposta += `💳 Pagamento: ${pedido.formaPagamento.toUpperCase()}`;

            if (pedido.tipoPedido === 'delivery' && pedido.getEnderecoFormatado()) {
                resposta += `\n\n📍 *Endereço:*\n${pedido.getEnderecoFormatado()}`;
            }

            await message.reply(resposta);
        } catch (error) {
            logger.error('Erro ao mostrar status:', error);
            await message.reply('Desculpe, ocorreu um erro ao verificar o status do pedido.');
        }
    }

    async getPedidoAtivo(phoneNumber) {
        return await PedidoRestaurante.findOne({
            'cliente.telefone': phoneNumber,
            status: { $in: ['pendente', 'confirmado', 'preparando'] }
        });
    }

    async saveToConversation(phoneNumber, content, sender) {
        try {
            let conversation = await Conversation.findOne({ phoneNumber });
            
            if (!conversation) {
                conversation = new Conversation({
                    phoneNumber,
                    messages: [],
                    lastInteraction: new Date()
                });
            }

            conversation.messages.push({
                content,
                timestamp: new Date(),
                sender,
                sentiment: 'neutral'
            });

            conversation.lastInteraction = new Date();
            await conversation.save();

            // Tentar extrair endereço se for mensagem do usuário
            if (sender === 'user') {
                const endereco = addressExtractor.extractFromText(content);
                if (endereco && addressExtractor.isValidAddress(endereco)) {
                    conversation.enderecoExtraido = {
                        ...endereco,
                        extraidoEm: new Date()
                    };
                    await conversation.save();
                }
            }

        } catch (error) {
            logger.error('Erro ao salvar conversa:', error);
        }
    }

    async processWithAI(message, phoneNumber) {
        try {
            const conversation = await Conversation.findOne({ phoneNumber })
                .sort({ 'messages.timestamp': -1 })
                .limit(5);

            const contextMessages = conversation
                ? conversation.messages.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.content
                }))
                : [];

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "Você é um assistente de restaurante prestativo e amigável. Ajude os clientes com pedidos, cardápio e informações sobre o restaurante. Mantenha as respostas curtas e diretas."
                    },
                    ...contextMessages,
                    {
                        role: "user",
                        content: message
                    }
                ]
            });

            return completion.choices[0].message.content;
        } catch (error) {
            logger.error('Erro ao processar mensagem com IA:', error);
            return "Desculpe, não entendi. Como posso ajudar?";
        }
    }

    isCommand(text) {
        const commands = [
            'cardapio', 'cardápio', 'menu',
            'pedido', 'fazer pedido', 'novo pedido',
            'mesa', 'mesas', 'verificar mesa',
            'endereco', 'endereço', 'informar endereco',
            'status', 'meu pedido', 'pedido atual',
            'ajuda', 'help', 'comandos'
        ];
        return commands.includes(text.toLowerCase().trim());
    }
}

module.exports = new MessageHandler();

