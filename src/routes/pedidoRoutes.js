const express = require('express');
const router = express.Router();
const PedidoRestaurante = require('../models/PedidoRestaurante');
const Produto = require('../models/Produto');
const Mesa = require('../models/Mesa');
const logger = require('../utils/logger');
const printService = require('../services/printService');

// Listar pedidos
router.get('/', async (req, res) => {
    try {
        const { status, tipoPedido, limit = 50 } = req.query;
        
        const filter = {};
        if (status) filter.status = status;
        if (tipoPedido) filter.tipoPedido = tipoPedido;

        const pedidos = await PedidoRestaurante.find(filter)
            .populate('mesa')
            .populate('itens.produto')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            pedidos
        });
    } catch (error) {
        logger.error('Erro ao listar pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar pedidos',
            error: error.message
        });
    }
});

// Obter pedido por ID
router.get('/:id', async (req, res) => {
    try {
        const pedido = await PedidoRestaurante.findById(req.params.id)
            .populate('mesa')
            .populate('itens.produto');

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        res.json({
            success: true,
            pedido
        });
    } catch (error) {
        logger.error('Erro ao buscar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar pedido',
            error: error.message
        });
    }
});

// Criar novo pedido
router.post('/', async (req, res) => {
    try {
        const {
            tipoPedido,
            cliente,
            mesa,
            itens,
            taxaEntrega,
            desconto,
            formaPagamento,
            observacoes
        } = req.body;

        if (!tipoPedido || !cliente || !itens || itens.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Dados incompletos para criar pedido'
            });
        }

        // Validar produtos
        for (const item of itens) {
            const produto = await Produto.findById(item.produto || item.produtoId);
            if (!produto || !produto.disponivel) {
                return res.status(400).json({
                    success: false,
                    message: `Produto ${item.nome || item.produto} não disponível`
                });
            }
        }

        // Se for pedido de mesa, validar mesa
        if (tipoPedido === 'mesa' && mesa) {
            const mesaObj = await Mesa.findById(mesa);
            if (!mesaObj || mesaObj.status !== 'livre') {
                return res.status(400).json({
                    success: false,
                    message: 'Mesa não disponível'
                });
            }
        }

        // Criar pedido
        const pedido = new PedidoRestaurante({
            tipoPedido,
            cliente,
            mesa: tipoPedido === 'mesa' ? mesa : null,
            itens: itens.map(item => ({
                produto: item.produto || item.produtoId,
                nome: item.nome,
                quantidade: item.quantidade,
                preco: item.preco,
                observacoes: item.observacoes
            })),
            taxaEntrega: tipoPedido === 'delivery' ? (taxaEntrega || 0) : 0,
            desconto: desconto || 0,
            formaPagamento: formaPagamento || 'dinheiro',
            observacoes
        });

        await pedido.save();

        // Se for pedido de mesa, ocupar a mesa
        if (tipoPedido === 'mesa' && mesa) {
            const mesaObj = await Mesa.findById(mesa);
            await mesaObj.ocupar(pedido._id);
        }

        // Imprimir ticket de cozinha automaticamente
        try {
            if (printService.isConnected()) {
                await printService.printKitchenTicket(pedido);
            }
        } catch (printError) {
            logger.error('Erro ao imprimir ticket de cozinha:', printError);
            // Não falhar o pedido se a impressão falhar
        }

        res.status(201).json({
            success: true,
            message: 'Pedido criado com sucesso',
            pedido
        });
    } catch (error) {
        logger.error('Erro ao criar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar pedido',
            error: error.message
        });
    }
});

// Atualizar status do pedido
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status é obrigatório'
            });
        }

        const pedido = await PedidoRestaurante.findById(req.params.id);

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        await pedido.atualizarStatus(status);

        // Se pedido foi entregue e for mesa, liberar mesa
        if (status === 'entregue' && pedido.tipoPedido === 'mesa' && pedido.mesa) {
            const mesa = await Mesa.findById(pedido.mesa);
            if (mesa) {
                await mesa.liberar();
            }
        }

        res.json({
            success: true,
            message: 'Status do pedido atualizado',
            pedido
        });
    } catch (error) {
        logger.error('Erro ao atualizar status:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar status',
            error: error.message
        });
    }
});

// Adicionar item ao pedido
router.post('/:id/itens', async (req, res) => {
    try {
        const pedido = await PedidoRestaurante.findById(req.params.id);

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        if (pedido.status === 'entregue' || pedido.status === 'cancelado') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível adicionar itens a um pedido finalizado'
            });
        }

        const { produto, nome, quantidade, preco, observacoes } = req.body;

        const produtoObj = await Produto.findById(produto);
        if (!produtoObj || !produtoObj.disponivel) {
            return res.status(400).json({
                success: false,
                message: 'Produto não disponível'
            });
        }

        await pedido.adicionarItem({
            produto,
            nome: nome || produtoObj.nome,
            quantidade,
            preco: preco || produtoObj.preco,
            observacoes
        });

        res.json({
            success: true,
            message: 'Item adicionado ao pedido',
            pedido
        });
    } catch (error) {
        logger.error('Erro ao adicionar item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao adicionar item',
            error: error.message
        });
    }
});

// Remover item do pedido
router.delete('/:id/itens/:itemId', async (req, res) => {
    try {
        const pedido = await PedidoRestaurante.findById(req.params.id);

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        if (pedido.status === 'entregue' || pedido.status === 'cancelado') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível remover itens de um pedido finalizado'
            });
        }

        await pedido.removerItem(req.params.itemId);

        res.json({
            success: true,
            message: 'Item removido do pedido',
            pedido
        });
    } catch (error) {
        logger.error('Erro ao remover item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao remover item',
            error: error.message
        });
    }
});

// Cancelar pedido
router.post('/:id/cancelar', async (req, res) => {
    try {
        const pedido = await PedidoRestaurante.findById(req.params.id);

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        if (pedido.status === 'entregue') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível cancelar um pedido já entregue'
            });
        }

        await pedido.atualizarStatus('cancelado');

        // Se for pedido de mesa, liberar mesa
        if (pedido.tipoPedido === 'mesa' && pedido.mesa) {
            const mesa = await Mesa.findById(pedido.mesa);
            if (mesa) {
                await mesa.liberar();
            }
        }

        res.json({
            success: true,
            message: 'Pedido cancelado com sucesso',
            pedido
        });
    } catch (error) {
        logger.error('Erro ao cancelar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao cancelar pedido',
            error: error.message
        });
    }
});

module.exports = router;

