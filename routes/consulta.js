const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaController');

// Consulta por placa
router.get('/consulta/:placa', consultaController.consultar.bind(consultaController));

// Força nova consulta (ignora cache)
router.get('/consulta/:placa/forcar', consultaController.forcarConsulta.bind(consultaController));

// Histórico de consultas de uma placa
router.get('/consulta/:placa/historico', consultaController.historico.bind(consultaController));

// Lista todas as consultas
router.get('/consultas', consultaController.listarConsultas.bind(consultaController));

// Estatísticas
router.get('/estatisticas', consultaController.estatisticas.bind(consultaController));

module.exports = router;

