const express = require('express');
const conectarDB = require('./db');
const restauranteRoutes = require('./routes/restaurantes');
const ordenRoutes = require('./routes/ordenes');

const app = express();
app.use(express.json());

// Conexión a la base de datos
conectarDB();

// Rutas
app.use('/api/restaurantes', restauranteRoutes);
app.use('/api/ordenes', ordenRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});