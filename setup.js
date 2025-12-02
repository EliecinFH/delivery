const mongoose = require('mongoose');
const connectDB = require('./src/config/database');
const Mesa = require('./src/models/Mesa');
const Produto = require('./src/models/Produto');
const logger = require('./src/utils/logger');
const config = require('./src/config/config');

async function setup() {
    try {
        console.log('🚀 Iniciando setup do sistema...');
        
        // Conectar ao banco
        await connectDB();
        
        // Criar mesas padrão
        console.log('📋 Criando mesas padrão...');
        const numeroMesas = config.NUMERO_MESAS || 20;
        const capacidadePadrao = config.CAPACIDADE_MESA_PADRAO || 4;
        
        for (let i = 1; i <= numeroMesas; i++) {
            const mesaExistente = await Mesa.findOne({ numero: i });
            if (!mesaExistente) {
                const mesa = new Mesa({
                    numero: i,
                    capacidade: capacidadePadrao,
                    status: 'livre'
                });
                await mesa.save();
                console.log(`✅ Mesa ${i} criada`);
            } else {
                console.log(`ℹ️  Mesa ${i} já existe`);
            }
        }
        
        // Criar produtos de exemplo
        console.log('🍽️  Criando produtos de exemplo...');
        const produtosExemplo = [
            {
                nome: 'Pizza Margherita',
                categoria: 'pizza',
                preco: 35.00,
                descricao: 'Molho de tomate, mussarela e manjericão',
                tempoPreparo: 25
            },
            {
                nome: 'Pizza Calabresa',
                categoria: 'pizza',
                preco: 38.00,
                descricao: 'Molho de tomate, mussarela e calabresa',
                tempoPreparo: 25
            },
            {
                nome: 'Hambúrguer Artesanal',
                categoria: 'lanche',
                preco: 22.00,
                descricao: 'Pão, hambúrguer, queijo, alface e tomate',
                tempoPreparo: 15
            },
            {
                nome: 'Batata Frita',
                categoria: 'lanche',
                preco: 12.00,
                descricao: 'Porção de batata frita',
                tempoPreparo: 10
            },
            {
                nome: 'Refrigerante',
                categoria: 'bebida',
                preco: 5.00,
                descricao: 'Lata 350ml',
                tempoPreparo: 0
            },
            {
                nome: 'Água',
                categoria: 'bebida',
                preco: 3.00,
                descricao: 'Garrafa 500ml',
                tempoPreparo: 0
            },
            {
                nome: 'Salada Caesar',
                categoria: 'entrada',
                preco: 18.00,
                descricao: 'Alface, croutons, parmesão e molho caesar',
                tempoPreparo: 10
            },
            {
                nome: 'Brownie com Sorvete',
                categoria: 'sobremesa',
                preco: 15.00,
                descricao: 'Brownie quente com sorvete de creme',
                tempoPreparo: 5
            }
        ];
        
        for (const produtoData of produtosExemplo) {
            const produtoExistente = await Produto.findOne({ nome: produtoData.nome });
            if (!produtoExistente) {
                const produto = new Produto(produtoData);
                await produto.save();
                console.log(`✅ Produto "${produtoData.nome}" criado`);
            } else {
                console.log(`ℹ️  Produto "${produtoData.nome}" já existe`);
            }
        }
        
        console.log('✅ Setup concluído com sucesso!');
        console.log('');
        console.log('📝 Próximos passos:');
        console.log('1. Configure o arquivo .env com suas credenciais');
        console.log('2. Execute: npm start');
        console.log('3. Escaneie o QR Code para conectar o WhatsApp');
        console.log('4. Configure a impressora através da interface web');
        
        process.exit(0);
    } catch (error) {
        logger.error('Erro no setup:', error);
        console.error('❌ Erro no setup:', error.message);
        process.exit(1);
    }
}

setup();

