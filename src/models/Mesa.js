const mongoose = require('mongoose');

const mesaSchema = new mongoose.Schema({
    numero: {
        type: Number,
        required: true,
        unique: true
    },
    capacidade: {
        type: Number,
        required: true,
        default: 4
    },
    status: {
        type: String,
        enum: ['livre', 'ocupada', 'reservada', 'manutencao'],
        default: 'livre'
    },
    pedidoAtual: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PedidoRestaurante'
    },
    garcom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
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

mesaSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Índices
mesaSchema.index({ numero: 1 });
mesaSchema.index({ status: 1 });

// Métodos
mesaSchema.methods.ocupar = function(pedidoId, garcomId) {
    this.status = 'ocupada';
    this.pedidoAtual = pedidoId;
    if (garcomId) this.garcom = garcomId;
    return this.save();
};

mesaSchema.methods.liberar = function() {
    this.status = 'livre';
    this.pedidoAtual = null;
    this.garcom = null;
    return this.save();
};

mesaSchema.methods.reservar = function() {
    this.status = 'reservada';
    return this.save();
};

module.exports = mongoose.model('Mesa', mesaSchema);

