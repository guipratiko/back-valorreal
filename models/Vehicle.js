const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  placa: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  marca: {
    type: String,
    default: null
  },
  modelo: {
    type: String,
    default: null
  },
  ano: {
    type: String,
    default: null
  },
  anoModelo: {
    type: String,
    default: null
  },
  cor: {
    type: String,
    default: null
  },
  chassi: {
    type: String,
    default: null
  },
  renavam: {
    type: String,
    default: null
  },
  uf: {
    type: String,
    default: null
  },
  municipio: {
    type: String,
    default: null
  },
  situacao: {
    type: String,
    default: null
  },
  valorFipe: {
    type: String,
    default: null
  },
  valorFipeScore: {
    type: Number,
    default: null
  },
  dadosFipe: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  dadosCompletos: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  mensagemRetorno: {
    type: String,
    default: null
  },
  dataConsulta: {
    type: Date,
    default: Date.now,
    index: true
  },
  ultimaAtualizacao: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índice composto para consultas rápidas
VehicleSchema.index({ placa: 1, dataConsulta: -1 });

// Método estático para buscar última consulta de uma placa
VehicleSchema.statics.findLatestByPlaca = function(placa) {
  return this.findOne({ placa: placa.toUpperCase() })
    .sort({ dataConsulta: -1 });
};

const Vehicle = mongoose.model('Vehicle', VehicleSchema);

module.exports = Vehicle;

