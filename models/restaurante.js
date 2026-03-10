const mongoose = require('mongoose');

const restauranteSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true }, // [cite: 54]
    descripcion: { type: String }, // [cite: 54]
    direccion: { // Datos embebidos [cite: 54, 164]
        calle: String, zona: String, ciudad: String, pais: String
    },
    ubicacion: { // Estructura GeoJSON Point para índices [cite: 42, 54]
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true } // [longitud, latitud] [cite: 54, 63]
    },
    categorias: [String], // Índice multikey [cite: 54]
    horario: { // [cite: 54]
        lunes: { abre: String, cierra: String },
        martes: { abre: String, cierra: String },
        miercoles: { abre: String, cierra: String },
        jueves: { abre: String, cierra: String },
        viernes: { abre: String, cierra: String },
        sabado: { abre: String, cierra: String },
        domingo: { abre: String, cierra: String },
    },
    calificacion_prom: { type: Number, min: 0, max: 5, default: 0 }, // [cite: 54]
    activo: { type: Boolean, default: true }, // [cite: 54]
    imagen_id: { type: mongoose.Schema.Types.ObjectId }, // Referencia a GridFS [cite: 54, 166]
    creado_en: { type: Date, default: Date.now } // [cite: 54]
});

// Índice geoespacial para búsquedas cercanas [cite: 292, 301]
restauranteSchema.index({ ubicacion: '2dsphere' });

module.exports = mongoose.model('Restaurante', restauranteSchema);