const axios = require('axios');

class ApiPlacasService {
  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'https://wdapi2.com.br';
    this.token = process.env.API_TOKEN;
    
    if (!this.token) {
      throw new Error('API_TOKEN não configurado no .env');
    }
  }

  /**
   * Consulta informações de um veículo pela placa
   * @param {string} placa - Placa do veículo (formato: AAA0X00 ou AAA9999)
   * @returns {Promise<Object>} Dados do veículo
   */
  async consultarPlaca(placa) {
    try {
      // Remove espaços e converte para maiúsculo
      const placaFormatada = placa.replace(/\s/g, '').toUpperCase();
      
      // Valida formato da placa
      if (!this.validarPlaca(placaFormatada)) {
        throw new Error('Formato de placa inválido. Use o formato AAA0X00 ou AAA9999');
      }

      const url = `${this.baseURL}/consulta/${placaFormatada}/${this.token}`;
      
      const response = await axios.get(url, {
        timeout: 30000, // 30 segundos
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ValorReal-Backend/1.0'
        }
      });

      const data = response.data;

      // Verifica se há erro na resposta
      if (data.mensagemRetorno && data.mensagemRetorno !== 'Sem erros.') {
        throw new Error(data.mensagemRetorno);
      }

      // Processa dados da FIPE se disponível
      let valorFipe = null;
      let valorFipeScore = null;
      let dadosFipe = null;

      if (data.fipe && data.fipe.dados && data.fipe.dados.length > 0) {
        // Ordena por score (maior score = melhor correspondência)
        const fipeOrdenado = data.fipe.dados.sort((a, b) => 
          (b.score || 0) - (a.score || 0)
        );
        
        const melhorFipe = fipeOrdenado[0];
        valorFipe = melhorFipe.texto_valor || null;
        valorFipeScore = melhorFipe.score || null;
        dadosFipe = data.fipe.dados;
      }

      // Monta objeto padronizado
      const veiculoData = {
        placa: data.placa || placaFormatada,
        marca: data.marca || null,
        modelo: data.modelo || null,
        ano: data.ano || null,
        anoModelo: data.anoModelo || null,
        cor: data.cor || null,
        chassi: data.chassi || null,
        renavam: data.renavam || null,
        uf: data.uf || null,
        municipio: data.municipio || null,
        situacao: data.situacao || null,
        valorFipe,
        valorFipeScore,
        dadosFipe,
        mensagemRetorno: data.mensagemRetorno || null,
        dadosCompletos: data // Salva resposta completa para referência
      };

      return veiculoData;
    } catch (error) {
      if (error.response) {
        // Erro da API
        throw new Error(`Erro na API Placas: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        // Timeout ou erro de conexão
        throw new Error('Erro ao conectar com a API Placas. Tente novamente.');
      } else {
        // Erro de validação ou outro
        throw error;
      }
    }
  }

  /**
   * Valida formato da placa
   * @param {string} placa - Placa a ser validada
   * @returns {boolean}
   */
  validarPlaca(placa) {
    // Formato antigo: AAA9999 (3 letras + 4 números)
    // Formato novo: AAA0X00 (3 letras + 1 número + 1 letra + 2 números)
    const formatoAntigo = /^[A-Z]{3}[0-9]{4}$/;
    const formatoNovo = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
    
    return formatoAntigo.test(placa) || formatoNovo.test(placa);
  }
}

module.exports = new ApiPlacasService();

