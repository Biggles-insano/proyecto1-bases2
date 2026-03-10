const mongoose = require('mongoose');

const articuloMenuSchema = new mongoose.Schema({
    restaurante_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurante', required: true }, // 
    nombre: { type: String, required: true }, // 
    descripcion: { type: String }, // 
    precio: { type: Number, min: 0, required: true }, // 
    categoria: { type: String, required: true }, // 
    ingredientes: [String], // Índice multikey 
    alergenos: [String], // 
    imagen_id: { type: mongoose.Schema.Types.ObjectId }, // Referencia a GridFS 
    disponible: { type: Boolean, default: true }, // 
    ventas_total: { type: Number, default: 0 } // Para reportes analíticos 
});

module.exports = mongoose.model('ArticuloMenu', articuloMenuSchema);