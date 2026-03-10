const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true }, // 
    email: { type: String, unique: true, required: true }, // 
    password_hash: { type: String, required: true }, // 
    rol: { type: String, enum: ['cliente', 'admin'], required: true }, // 
    telefono: { type: String }, // 
    direcciones: [{ // Datos embebidos
        etiqueta: String,
        calle: String,
        zona: String,
        ciudad: String
    }],
    preferencias: [String], // 
    activo: { type: Boolean, default: true }, // 
    creado_en: { type: Date, default: Date.now } // 
});

module.exports = mongoose.model('Usuario', usuarioSchema);