const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Serviço para gerar URLs de pesquisa no OLX e buscar preços
 */
class OlxService {
  /**
   * Gera URL de pesquisa no OLX baseada nos dados do veículo
   * @param {Object} veiculoData - Dados do veículo (marca, modelo, anoModelo)
   * @returns {string|null} - URL do OLX ou null se não houver dados suficientes
   */
  gerarUrlOlx(veiculoData) {
    const { marca, modelo, anoModelo } = veiculoData;

    // Verifica se tem os dados mínimos necessários
    if (!marca || !modelo || !anoModelo) {
      return null;
    }

    // Normaliza marca (lowercase, sem acentos, espaços viram hífens)
    const marcaNormalizada = this.normalizarTexto(marca);

    // Normaliza modelo (lowercase, sem acentos, espaços viram hífens)
    const modeloNormalizado = this.normalizarTexto(modelo);

    // Extrai apenas o ano (remove "ano" ou outros textos)
    const ano = anoModelo.toString().trim().split(/[\s-]/)[0];

    // Constrói a URL do OLX
    // Formato: https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/{marca}/{modelo}/{ano}
    const url = `https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/${marcaNormalizada}/${modeloNormalizado}/${ano}`;

    return url;
  }

  /**
   * Normaliza texto para URL (remove acentos, converte para lowercase, substitui espaços por hífens)
   * @param {string} texto - Texto a ser normalizado
   * @returns {string} - Texto normalizado
   */
  normalizarTexto(texto) {
    if (!texto) return '';

    return texto
      .toLowerCase()
      .normalize('NFD') // Decompõe caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .trim()
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, ''); // Remove hífens no início e fim
  }

  /**
   * Busca preços de veículos no OLX e retorna estatísticas
   * @param {Object} veiculoData - Dados do veículo (marca, modelo, anoModelo)
   * @returns {Promise<Object|null>} - Estatísticas de preços ou null se não houver dados
   */
  async buscarPrecosOlx(veiculoData) {
    try {
      const urlOlx = this.gerarUrlOlx(veiculoData);
      
      if (!urlOlx) {
        return null;
      }

      // Faz requisição para a página do OLX com timeout reduzido
      const response = await axios.get(urlOlx, {
        timeout: 8000, // Reduzido para 8 segundos
        maxRedirects: 5,
        validateStatus: function (status) {
          return status >= 200 && status < 400; // Aceita redirects
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });

      const $ = cheerio.load(response.data);
      const precos = [];

      // Busca preços nos anúncios
      // O OLX usa diferentes seletores, vamos tentar os mais comuns
      $('[data-ds-component="DS-AdCard-Link"]').each((i, element) => {
        const precoTexto = $(element).find('[data-ds-component="DS-AdCard-Price"]').text().trim();
        if (precoTexto) {
          const preco = this.extrairPreco(precoTexto);
          if (preco) {
            precos.push(preco);
          }
        }
      });

      // Tenta outro seletor caso o primeiro não funcione
      if (precos.length === 0) {
        $('a[href*="/autos-e-pecas/"]').each((i, element) => {
          const precoTexto = $(element).find('.olx-text').text() || 
                            $(element).find('[class*="price"]').text() ||
                            $(element).text();
          const preco = this.extrairPreco(precoTexto);
          if (preco) {
            precos.push(preco);
          }
        });
      }

      // Se ainda não encontrou, tenta buscar em elementos com "R$" (limitado para não travar)
      if (precos.length === 0) {
        let count = 0;
        $('*').each((i, element) => {
          if (count++ > 500) return false; // Limita a 500 elementos para não travar
          const texto = $(element).text();
          if (texto && texto.includes('R$') && texto.length < 100) { // Limita tamanho do texto
            const preco = this.extrairPreco(texto);
            if (preco && preco > 1000 && preco < 10000000) { // Filtra valores razoáveis
              precos.push(preco);
            }
          }
        });
      }

      // Remove duplicatas e valores muito discrepantes
      const precosUnicos = [...new Set(precos)].filter(p => p > 0);
      
      if (precosUnicos.length === 0) {
        return null;
      }

      // Calcula estatísticas
      const menorPreco = Math.min(...precosUnicos);
      const maiorPreco = Math.max(...precosUnicos);
      const mediaPreco = precosUnicos.reduce((sum, p) => sum + p, 0) / precosUnicos.length;

      return {
        menorPreco: this.formatarPreco(menorPreco),
        maiorPreco: this.formatarPreco(maiorPreco),
        mediaPreco: this.formatarPreco(mediaPreco),
        quantidadeAnuncios: precosUnicos.length,
        urlOlx: urlOlx
      };
    } catch (error) {
      // Log mais detalhado apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao buscar preços no OLX:', error.message);
      }
      return null;
    }
  }

  /**
   * Extrai valor numérico de um texto de preço
   * @param {string} texto - Texto contendo o preço
   * @returns {number|null} - Valor numérico ou null
   */
  extrairPreco(texto) {
    if (!texto) return null;

    // Remove tudo exceto números, vírgulas e pontos
    const limpo = texto.replace(/[^\d,.-]/g, '');
    
    // Tenta extrair o número (formato brasileiro: R$ 50.000,00 ou 50000)
    const match = limpo.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
    if (match) {
      const numero = match[1]
        .replace(/\./g, '') // Remove pontos (milhares)
        .replace(',', '.'); // Substitui vírgula por ponto (decimal)
      return parseFloat(numero);
    }

    // Tenta formato simples (apenas números)
    const numeros = texto.replace(/\D/g, '');
    if (numeros.length >= 4) {
      return parseFloat(numeros);
    }

    return null;
  }

  /**
   * Formata preço para exibição
   * @param {number} preco - Preço numérico
   * @returns {string} - Preço formatado
   */
  formatarPreco(preco) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  }
}

module.exports = new OlxService();

