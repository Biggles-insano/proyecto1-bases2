const mongoose = require('mongoose');

const restauranteSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    descripcion: { type: String },
    direccion: { // Datos embebidos
        calle: String, zona: String, ciudad: String, pais: String
    },
    ubicacion: { // Estructura GeoJSON Point para índices
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true } // [longitud, latitud]
    },
    categorias: [String], // Índice multikey
    horario: { // 
        lunes: { abre: String, cierra: String },
        martes: { abre: String, cierra: String },
        miercoles: { abre: String, cierra: String },
        jueves: { abre: String, cierra: String },
        viernes: { abre: String, cierra: String },
        sabado: { abre: String, cierra: String },
        domingo: { abre: String, cierra: String },
    },
    calificacion_prom: { type: Number, min: 0, max: 5, default: 0 },
    activo: { type: Boolean, default: true },
    imagen_id: { type: mongoose.Schema.Types.ObjectId },
    creado_en: { type: Date, default: Date.now }
});

// Índice geoespacial para búsquedas cercanas [cite: 292, 301]
restauranteSchema.index({ ubicacion: '2dsphere' });

// Índice full-text para búsqueda por nombre y descripción
restauranteSchema.index(
    { nombre: 'text', descripcion: 'text' },
    { name: 'idx_rest_text', weights: { nombre: 10, descripcion: 5 } }
);

module.exports = mongoose.model('Restaurante', restauranteSchema, 'restaurantes');