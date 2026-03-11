const mongoose = require('mongoose');

const ordenSchema = new mongoose.Schema({
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    restaurante_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurante', required: true },
    articulos: [{ // Documentos embebidos 
        articulo_id: mongoose.Schema.Types.ObjectId,
        nombre: String,
        precio: Number,
        cantidad: Number,
        notas: String
    }],
    estado: {
        type: String,
        enum: ['pendiente', 'en preparacion', 'camino', 'entregada', 'cancelada'],
        default: 'pendiente'
    },
    historial_estados: [{ // Historial acotado 
        estado: String,
        timestamp: { type: Date, default: Date.now },
        nota: String
    }],
    total: { type: Number, min: 0, required: true },
    direccion_entrega: { calle: String, zona: String, ciudad: String }, // Snapshot de dirección
    metodo_pago: { type: String, enum: ['efectivo', 'tarjeta', 'transferencia'] },
    notas: String,
    creado_en: { type: Date, default: Date.now },
    actualizado_en: { type: Date, default: Date.now }
});

ordenSchema.index({ usuario_id: 1, creado_en: -1 });

module.exports = mongoose.model('Orden', ordenSchema, 'ordenes');