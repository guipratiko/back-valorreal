/**
 * Serviço para gerar URLs de pesquisa no OLX
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
}

module.exports = new OlxService();

