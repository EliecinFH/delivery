const express = require('express');
const router = express.Router();
const Produto = require('../models/Produto');
const logger = require('../utils/logger');

// Listar produtos
router.get('/', async (req, res) => {
    try {
        const { categoria, disponivel } = req.query;
        
        const filter = {};
        if (categoria) filter.categoria = categoria;
        if (disponivel !== undefined) filter.disponivel = disponivel === 'true';

        const produtos = await Produto.find(filter)
            .sort({ categoria: 1, nome: 1 });

        res.json({
            success: true,
            produtos
        });
    } catch (error) {
        logger.error('Erro ao listar produtos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar produtos',
            error: error.message
        });
    }
});

// Obter produto por ID
router.get('/:id', async (req, res) => {
    try {
        const produto = await Produto.findById(req.params.id);

        if (!produto) {
            return res.status(404).json({
                success: false,
                message: 'Produto não encontrado'
            });
        }

        res.json({
            success: true,
            produto
        });
    } catch (error) {
        logger.error('Erro ao buscar produto:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar produto',
            error: error.message
        });
    }
});

// Criar produto
router.post('/', async (req, res) => {
    try {
        const {
            codigo,
            nome,
            categoria,
            preco,
            descricao,
            imagem,
            disponivel,
            tempoPreparo,
            ingredientes,
            observacoes
        } = req.body;

        if (!nome || !categoria || !preco) {
            return res.status(400).json({
                success: false,
                message: 'Nome, categoria e preço são obrigatórios'
            });
        }

        const produto = new Produto({
            codigo,
            nome,
            categoria,
            preco,
            descricao,
            imagem,
            disponivel: disponivel !== undefined ? disponivel : true,
            tempoPreparo: tempoPreparo || 20,
            ingredientes: ingredientes || [],
            observacoes
        });

        await produto.save();

        res.status(201).json({
            success: true,
            message: 'Produto criado com sucesso',
            produto
        });
    } catch (error) {
        logger.error('Erro ao criar produto:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar produto',
            error: error.message
        });
    }
});

// Atualizar produto
router.put('/:id', async (req, res) => {
    try {
        const produto = await Produto.findById(req.params.id);

        if (!produto) {
            return res.status(404).json({
                success: false,
                message: 'Produto não encontrado'
            });
        }

        const {
            codigo,
            nome,
            categoria,
            preco,
            descricao,
            imagem,
            disponivel,
            tempoPreparo,
            ingredientes,
            observacoes
        } = req.body;

        if (codigo !== undefined) produto.codigo = codigo;
        if (nome !== undefined) produto.nome = nome;
        if (categoria !== undefined) produto.categoria = categoria;
        if (preco !== undefined) produto.preco = preco;
        if (descricao !== undefined) produto.descricao = descricao;
        if (imagem !== undefined) produto.imagem = imagem;
        if (disponivel !== undefined) produto.disponivel = disponivel;
        if (tempoPreparo !== undefined) produto.tempoPreparo = tempoPreparo;
        if (ingredientes !== undefined) produto.ingredientes = ingredientes;
        if (observacoes !== undefined) produto.observacoes = observacoes;

        await produto.save();

        res.json({
            success: true,
            message: 'Produto atualizado com sucesso',
            produto
        });
    } catch (error) {
        logger.error('Erro ao atualizar produto:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar produto',
            error: error.message
        });
    }
});

// Deletar produto
router.delete('/:id', async (req, res) => {
    try {
        const produto = await Produto.findById(req.params.id);

        if (!produto) {
            return res.status(404).json({
                success: false,
                message: 'Produto não encontrado'
            });
        }

        await Produto.deleteOne({ _id: req.params.id });

        res.json({
            success: true,
            message: 'Produto deletado com sucesso'
        });
    } catch (error) {
        logger.error('Erro ao deletar produto:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao deletar produto',
            error: error.message
        });
    }
});

module.exports = router;

