const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        index: true
    },
    messages: [{
        content: String,
        timestamp: Date,
        sender: String, // 'user' ou 'bot'
        sentiment: {
            type: String,
            enum: ['positive', 'negative', 'neutral'],
            default: 'neutral'
        }
    }],
    enderecoExtraido: {
        rua: String,
        numero: String,
        complemento: String,
        bairro: String,
        cidade: String,
        estado: String,
        cep: String,
        referencia: String,
        extraidoEm: Date
    },
    ultimoPedido: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PedidoRestaurante'
    },
    lastInteraction: Date
});

// Índices
conversationSchema.index({ phoneNumber: 1 });
conversationSchema.index({ lastInteraction: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);

