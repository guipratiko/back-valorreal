const Vehicle = require('../models/Vehicle');
const apiPlacasService = require('../services/apiPlacasService');

class ConsultaController {
  /**
   * Consulta valor de mercado de um veículo pela placa
   * GET /api/consulta/:placa
   */
  async consultar(req, res, next) {
    try {
      const { placa } = req.params;

      if (!placa) {
        return res.status(400).json({
          error: 'Placa é obrigatória',
          message: 'Informe a placa do veículo no formato AAA0X00 ou AAA9999'
        });
      }

      // Verifica se já existe consulta recente (últimas 24 horas)
      let consultaRecente = null;
      try {
        consultaRecente = await Vehicle.findLatestByPlaca(placa);
      } catch (dbError) {
        console.warn('Aviso: Não foi possível consultar o cache do MongoDB:', dbError.message);
        // Continua mesmo sem cache
      }

      const agora = new Date();
      const umDiaAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

      let veiculoData;

      if (consultaRecente && consultaRecente.dataConsulta > umDiaAtras) {
        // Usa dados do cache
        veiculoData = consultaRecente.toObject();
        veiculoData.fonte = 'cache';
      } else {
        // Consulta na API
        veiculoData = await apiPlacasService.consultarPlaca(placa);
        veiculoData.fonte = 'api';

        // Tenta salvar no banco de dados (não bloqueia se falhar)
        try {
          const veiculo = new Vehicle(veiculoData);
          await veiculo.save();
        } catch (dbError) {
          console.warn('Aviso: Não foi possível salvar no MongoDB:', dbError.message);
          // Continua mesmo sem salvar
        }
      }

      res.json({
        success: true,
        data: veiculoData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Força nova consulta na API (ignora cache)
   * GET /api/consulta/:placa/forcar
   */
  async forcarConsulta(req, res, next) {
    try {
      const { placa } = req.params;

      if (!placa) {
        return res.status(400).json({
          error: 'Placa é obrigatória'
        });
      }

      // Consulta na API
      const veiculoData = await apiPlacasService.consultarPlaca(placa);
      veiculoData.fonte = 'api';

      // Tenta salvar no banco de dados (não bloqueia se falhar)
      try {
        const veiculo = new Vehicle(veiculoData);
        await veiculo.save();
      } catch (dbError) {
        console.warn('Aviso: Não foi possível salvar no MongoDB:', dbError.message);
        // Continua mesmo sem salvar
      }

      res.json({
        success: true,
        data: veiculoData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista histórico de consultas de uma placa
   * GET /api/consulta/:placa/historico
   */
  async historico(req, res, next) {
    try {
      const { placa } = req.params;
      const { limit = 10, page = 1 } = req.query;

      const limitNum = parseInt(limit);
      const pageNum = parseInt(page);
      const skip = (pageNum - 1) * limitNum;

      const consultas = await Vehicle.find({ placa: placa.toUpperCase() })
        .sort({ dataConsulta: -1 })
        .limit(limitNum)
        .skip(skip)
        .select('-dadosCompletos -dadosFipe') // Remove campos grandes
        .lean();

      const total = await Vehicle.countDocuments({ placa: placa.toUpperCase() });

      res.json({
        success: true,
        data: consultas,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista todas as consultas (com paginação)
   * GET /api/consultas
   */
  async listarConsultas(req, res, next) {
    try {
      const { limit = 20, page = 1, placa } = req.query;

      const limitNum = parseInt(limit);
      const pageNum = parseInt(page);
      const skip = (pageNum - 1) * limitNum;

      const query = {};
      if (placa) {
        query.placa = placa.toUpperCase();
      }

      const consultas = await Vehicle.find(query)
        .sort({ dataConsulta: -1 })
        .limit(limitNum)
        .skip(skip)
        .select('-dadosCompletos -dadosFipe')
        .lean();

      const total = await Vehicle.countDocuments(query);

      res.json({
        success: true,
        data: consultas,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Estatísticas gerais
   * GET /api/estatisticas
   */
  async estatisticas(req, res, next) {
    try {
      const totalConsultas = await Vehicle.countDocuments();
      const placasUnicas = await Vehicle.distinct('placa').then(placas => placas.length);
      
      const consultasHoje = await Vehicle.countDocuments({
        dataConsulta: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      });

      const consultasUltimos7Dias = await Vehicle.countDocuments({
        dataConsulta: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      });

      res.json({
        success: true,
        data: {
          totalConsultas,
          placasUnicas,
          consultasHoje,
          consultasUltimos7Dias
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ConsultaController();

