const express = require('express');
const router = express.Router();
const PedidoRestaurante = require('../models/PedidoRestaurante');
const Mesa = require('../models/Mesa');
const printService = require('../services/printService');
const logger = require('../utils/logger');
const config = require('../config/config');

// Conectar impressora
router.post('/conectar', async (req, res) => {
    try {
        const { tipo, ip, porta, vendorId, productId } = req.body;

        let connected = false;

        if (tipo === 'network') {
            connected = await printService.connectNetwork(
                ip || config.IMPRESSORA_IP,
                porta || config.IMPRESSORA_PORTA
            );
        } else if (tipo === 'usb') {
            if (!vendorId || !productId) {
                return res.status(400).json({
                    success: false,
                    message: 'vendorId e productId são obrigatórios para impressora USB'
                });
            }
            connected = await printService.connectUSB(vendorId, productId);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Tipo de impressora inválido. Use "network" ou "usb"'
            });
        }

        if (connected) {
            res.json({
                success: true,
                message: 'Impressora conectada com sucesso'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Falha ao conectar impressora'
            });
        }
    } catch (error) {
        logger.error('Erro ao conectar impressora:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao conectar impressora',
            error: error.message
        });
    }
});

// Verificar status da impressora
router.get('/status', (req, res) => {
    try {
        res.json({
            success: true,
            conectada: printService.isConnected()
        });
    } catch (error) {
        logger.error('Erro ao verificar status:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar status',
            error: error.message
        });
    }
});

// Teste de impressão
router.post('/teste', async (req, res) => {
    try {
        if (!printService.isConnected()) {
            return res.status(400).json({
                success: false,
                message: 'Impressora não conectada'
            });
        }

        await printService.testPrint();

        res.json({
            success: true,
            message: 'Teste de impressão realizado com sucesso'
        });
    } catch (error) {
        logger.error('Erro no teste de impressão:', error);
        res.status(500).json({
            success: false,
            message: 'Erro no teste de impressão',
            error: error.message
        });
    }
});

// Imprimir ticket de cozinha
router.post('/pedido/:id/cozinha', async (req, res) => {
    try {
        if (!printService.isConnected()) {
            return res.status(400).json({
                success: false,
                message: 'Impressora não conectada'
            });
        }

        const pedido = await PedidoRestaurante.findById(req.params.id)
            .populate('itens.produto');

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        await printService.printKitchenTicket(pedido);

        res.json({
            success: true,
            message: 'Ticket de cozinha impresso com sucesso',
            numeroPedido: pedido.numeroPedido
        });
    } catch (error) {
        logger.error('Erro ao imprimir ticket de cozinha:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao imprimir ticket de cozinha',
            error: error.message
        });
    }
});

// Imprimir ticket de entrega
router.post('/pedido/:id/entrega', async (req, res) => {
    try {
        if (!printService.isConnected()) {
            return res.status(400).json({
                success: false,
                message: 'Impressora não conectada'
            });
        }

        const pedido = await PedidoRestaurante.findById(req.params.id)
            .populate('itens.produto');

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        if (pedido.tipoPedido !== 'delivery') {
            return res.status(400).json({
                success: false,
                message: 'Este pedido não é de delivery'
            });
        }

        await printService.printDeliveryTicket(pedido);

        res.json({
            success: true,
            message: 'Ticket de entrega impresso com sucesso',
            numeroPedido: pedido.numeroPedido
        });
    } catch (error) {
        logger.error('Erro ao imprimir ticket de entrega:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao imprimir ticket de entrega',
            error: error.message
        });
    }
});

// Imprimir ticket de mesa
router.post('/pedido/:id/mesa', async (req, res) => {
    try {
        if (!printService.isConnected()) {
            return res.status(400).json({
                success: false,
                message: 'Impressora não conectada'
            });
        }

        const pedido = await PedidoRestaurante.findById(req.params.id)
            .populate('itens.produto')
            .populate('mesa');

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        if (pedido.tipoPedido !== 'mesa') {
            return res.status(400).json({
                success: false,
                message: 'Este pedido não é de mesa'
            });
        }

        if (!pedido.mesa) {
            return res.status(400).json({
                success: false,
                message: 'Mesa não associada ao pedido'
            });
        }

        await printService.printTableTicket(pedido, pedido.mesa);

        res.json({
            success: true,
            message: 'Ticket de mesa impresso com sucesso',
            numeroPedido: pedido.numeroPedido,
            mesa: pedido.mesa.numero
        });
    } catch (error) {
        logger.error('Erro ao imprimir ticket de mesa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao imprimir ticket de mesa',
            error: error.message
        });
    }
});

module.exports = router;

