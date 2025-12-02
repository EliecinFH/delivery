const mongoose = require('mongoose');

const pedidoRestauranteSchema = new mongoose.Schema({
    numeroPedido: {
        type: String,
        unique: true,
        sparse: true
    },
    tipoPedido: {
        type: String,
        enum: ['delivery', 'mesa', 'balcao', 'retirada'],
        required: true
    },
    cliente: {
        nome: {
            type: String,
            required: true
        },
        telefone: {
            type: String,
            required: true
        },
        endereco: {
            rua: String,
            numero: String,
            complemento: String,
            bairro: String,
            cidade: String,
            estado: String,
            cep: String,
            referencia: String
        }
    },
    mesa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mesa'
    },
    itens: [{
        produto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Produto'
        },
        nome: String,
        quantidade: {
            type: Number,
            required: true,
            min: 1
        },
        preco: {
            type: Number,
            required: true
        },
        observacoes: String
    }],
    subtotal: {
        type: Number,
        default: 0
    },
    taxaEntrega: {
        type: Number,
        default: 0
    },
    desconto: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    formaPagamento: {
        type: String,
        enum: ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'vale_refeicao'],
        default: 'dinheiro'
    },
    status: {
        type: String,
        enum: ['pendente', 'confirmado', 'preparando', 'pronto', 'entregue', 'cancelado'],
        default: 'pendente'
    },
    observacoes: {
        type: String
    },
    tempoPreparo: {
        type: Number, // em minutos
        default: 30
    },
    tempoEstimadoEntrega: {
        type: Date
    },
    impresso: {
        cozinha: {
            type: Boolean,
            default: false
        },
        entrega: {
            type: Boolean,
            default: false
        },
        balcao: {
            type: Boolean,
            default: false
        }
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

// Middleware para atualizar updatedAt
pedidoRestauranteSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Middleware para gerar número do pedido automaticamente
pedidoRestauranteSchema.pre('save', async function(next) {
    if (!this.numeroPedido) {
        const count = await mongoose.model('PedidoRestaurante').countDocuments();
        const prefix = this.tipoPedido === 'delivery' ? 'D' : 
                      this.tipoPedido === 'mesa' ? 'M' : 
                      this.tipoPedido === 'balcao' ? 'B' : 'R';
        this.numeroPedido = `${prefix}${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

// Middleware para calcular total
pedidoRestauranteSchema.pre('save', function(next) {
    this.subtotal = this.itens.reduce((sum, item) => {
        return sum + (item.preco * item.quantidade);
    }, 0);
    
    this.total = this.subtotal + this.taxaEntrega - this.desconto;
    next();
});

// Índices
pedidoRestauranteSchema.index({ numeroPedido: 1 });
pedidoRestauranteSchema.index({ 'cliente.telefone': 1 });
pedidoRestauranteSchema.index({ status: 1 });
pedidoRestauranteSchema.index({ tipoPedido: 1 });
pedidoRestauranteSchema.index({ createdAt: -1 });
pedidoRestauranteSchema.index({ mesa: 1 });

// Métodos
pedidoRestauranteSchema.methods.calcularTotal = function() {
    this.subtotal = this.itens.reduce((sum, item) => {
        return sum + (item.preco * item.quantidade);
    }, 0);
    
    this.total = this.subtotal + this.taxaEntrega - this.desconto;
    return this.total;
};

pedidoRestauranteSchema.methods.adicionarItem = function(item) {
    this.itens.push(item);
    this.calcularTotal();
    return this.save();
};

pedidoRestauranteSchema.methods.removerItem = function(itemId) {
    this.itens = this.itens.filter(item => 
        item._id.toString() !== itemId.toString()
    );
    this.calcularTotal();
    return this.save();
};

pedidoRestauranteSchema.methods.atualizarStatus = function(novoStatus) {
    this.status = novoStatus;
    return this.save();
};

pedidoRestauranteSchema.methods.getEnderecoFormatado = function() {
    if (this.tipoPedido !== 'delivery' || !this.cliente.endereco) {
        return null;
    }
    
    const addr = this.cliente.endereco;
    let endereco = `${addr.rua}, ${addr.numero}`;
    if (addr.complemento) endereco += `, ${addr.complemento}`;
    if (addr.bairro) endereco += ` - ${addr.bairro}`;
    if (addr.cidade) endereco += `, ${addr.cidade}`;
    if (addr.estado) endereco += `/${addr.estado}`;
    if (addr.cep) endereco += ` - CEP: ${addr.cep}`;
    if (addr.referencia) endereco += `\nReferência: ${addr.referencia}`;
    
    return endereco;
};

module.exports = mongoose.model('PedidoRestaurante', pedidoRestauranteSchema);

