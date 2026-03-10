const mongoose = require('mongoose');

const resenaSchema = new mongoose.Schema({
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    restaurante_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurante', required: true },
    orden_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Orden' },
    calificacion: { type: Number, min: 1, max: 5, required: true },
    titulo: { type: String, required: true },
    comentario: { type: String, required: true },
    tags: [String],
    respuesta: { // Subdocumento embebido  
        texto: String,
        admin_id: mongoose.Schema.Types.ObjectId,
        fecha: Date
    },
    util_count: { type: Number, default: 0 },
    creado_en: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resena', resenaSchema);