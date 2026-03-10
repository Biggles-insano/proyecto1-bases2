const mongoose = require('mongoose');
require('dotenv').config();

const conectarDB = async () => {
    try {
        // Conexión a la base
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conexión exitosa');
    } catch (error) {
        console.error('Error al conectar :', error.message);
        process.exit(1); // Detener el proceso si falla la conexión
    }
};

module.exports = conectarDB;