const express = require('express');
const router = express.Router();
const Mesa = require('../models/Mesa');
const PedidoRestaurante = require('../models/PedidoRestaurante');
const logger = require('../utils/logger');

// Listar todas as mesas
router.get('/', async (req, res) => {
    try {
        const mesas = await Mesa.find()
            .populate('pedidoAtual')
            .populate('garcom', 'name username')
            .sort({ numero: 1 });

        res.json({
            success: true,
            mesas
        });
    } catch (error) {
        logger.error('Erro ao listar mesas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar mesas',
            error: error.message
        });
    }
});

// Obter mesa por número
router.get('/:numero', async (req, res) => {
    try {
        const mesa = await Mesa.findOne({ numero: req.params.numero })
            .populate('pedidoAtual')
            .populate('garcom', 'name username');

        if (!mesa) {
            return res.status(404).json({
                success: false,
                message: 'Mesa não encontrada'
            });
        }

        res.json({
            success: true,
            mesa
        });
    } catch (error) {
        logger.error('Erro ao buscar mesa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar mesa',
            error: error.message
        });
    }
});

// Criar nova mesa
router.post('/', async (req, res) => {
    try {
        const { numero, capacidade, observacoes } = req.body;

        if (!numero) {
            return res.status(400).json({
                success: false,
                message: 'Número da mesa é obrigatório'
            });
        }

        const mesaExistente = await Mesa.findOne({ numero });
        if (mesaExistente) {
            return res.status(400).json({
                success: false,
                message: 'Mesa com este número já existe'
            });
        }

        const mesa = new Mesa({
            numero,
            capacidade: capacidade || 4,
            observacoes
        });

        await mesa.save();

        res.status(201).json({
            success: true,
            message: 'Mesa criada com sucesso',
            mesa
        });
    } catch (error) {
        logger.error('Erro ao criar mesa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar mesa',
            error: error.message
        });
    }
});

// Ocupar mesa
router.post('/:numero/ocupar', async (req, res) => {
    try {
        const mesa = await Mesa.findOne({ numero: req.params.numero });

        if (!mesa) {
            return res.status(404).json({
                success: false,
                message: 'Mesa não encontrada'
            });
        }

        if (mesa.status === 'ocupada') {
            return res.status(400).json({
                success: false,
                message: 'Mesa já está ocupada'
            });
        }

        const { pedidoId, garcomId } = req.body;

        await mesa.ocupar(pedidoId, garcomId);

        res.json({
            success: true,
            message: 'Mesa ocupada com sucesso',
            mesa
        });
    } catch (error) {
        logger.error('Erro ao ocupar mesa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao ocupar mesa',
            error: error.message
        });
    }
});

// Liberar mesa
router.post('/:numero/liberar', async (req, res) => {
    try {
        const mesa = await Mesa.findOne({ numero: req.params.numero });

        if (!mesa) {
            return res.status(404).json({
                success: false,
                message: 'Mesa não encontrada'
            });
        }

        await mesa.liberar();

        res.json({
            success: true,
            message: 'Mesa liberada com sucesso',
            mesa
        });
    } catch (error) {
        logger.error('Erro ao liberar mesa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao liberar mesa',
            error: error.message
        });
    }
});

// Reservar mesa
router.post('/:numero/reservar', async (req, res) => {
    try {
        const mesa = await Mesa.findOne({ numero: req.params.numero });

        if (!mesa) {
            return res.status(404).json({
                success: false,
                message: 'Mesa não encontrada'
            });
        }

        if (mesa.status !== 'livre') {
            return res.status(400).json({
                success: false,
                message: 'Mesa não está disponível para reserva'
            });
        }

        await mesa.reservar();

        res.json({
            success: true,
            message: 'Mesa reservada com sucesso',
            mesa
        });
    } catch (error) {
        logger.error('Erro ao reservar mesa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao reservar mesa',
            error: error.message
        });
    }
});

// Atualizar mesa
router.put('/:numero', async (req, res) => {
    try {
        const mesa = await Mesa.findOne({ numero: req.params.numero });

        if (!mesa) {
            return res.status(404).json({
                success: false,
                message: 'Mesa não encontrada'
            });
        }

        const { capacidade, status, observacoes } = req.body;

        if (capacidade) mesa.capacidade = capacidade;
        if (status) mesa.status = status;
        if (observacoes !== undefined) mesa.observacoes = observacoes;

        await mesa.save();

        res.json({
            success: true,
            message: 'Mesa atualizada com sucesso',
            mesa
        });
    } catch (error) {
        logger.error('Erro ao atualizar mesa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar mesa',
            error: error.message
        });
    }
});

// Deletar mesa
router.delete('/:numero', async (req, res) => {
    try {
        const mesa = await Mesa.findOne({ numero: req.params.numero });

        if (!mesa) {
            return res.status(404).json({
                success: false,
                message: 'Mesa não encontrada'
            });
        }

        if (mesa.status === 'ocupada') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível deletar uma mesa ocupada'
            });
        }

        await Mesa.deleteOne({ numero: req.params.numero });

        res.json({
            success: true,
            message: 'Mesa deletada com sucesso'
        });
    } catch (error) {
        logger.error('Erro ao deletar mesa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao deletar mesa',
            error: error.message
        });
    }
});

module.exports = router;

