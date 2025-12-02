const mongoose = require('mongoose');

const produtoSchema = new mongoose.Schema({
    codigo: {
        type: String,
        unique: true,
        sparse: true
    },
    nome: {
        type: String,
        required: true
    },
    categoria: {
        type: String,
        required: true,
        enum: ['entrada', 'prato_principal', 'bebida', 'sobremesa', 'lanche', 'pizza', 'outros']
    },
    preco: {
        type: Number,
        required: true
    },
    descricao: {
        type: String
    },
    imagem: {
        type: String
    },
    disponivel: {
        type: Boolean,
        default: true
    },
    tempoPreparo: {
        type: Number, // em minutos
        default: 20
    },
    ingredientes: [{
        type: String
    }],
    observacoes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

produtoSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Índices
produtoSchema.index({ categoria: 1 });
produtoSchema.index({ disponivel: 1 });
produtoSchema.index({ nome: 'text' });

module.exports = mongoose.model('Produto', produtoSchema);

