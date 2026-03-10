const express = require('express');
const conectarDB = require('./db');
const restauranteRoutes = require('./routes/restaurantes');
const ordenRoutes = require('./routes/ordenes');
const usuarioRoutes = require('./routes/usuarios');
const resenaRoutes  = require('./routes/resenas');
const reporteRoutes = require('./routes/reportes');
const archivoRoutes = require('./routes/archivos');

const app = express();
app.use(express.json());

// Conexión a la base de datos
conectarDB();

// Rutas
app.use('/api/restaurantes', restauranteRoutes);
app.use('/api/ordenes', ordenRoutes);
app.use('/api/usuarios',  usuarioRoutes);
app.use('/api/resenas',   resenaRoutes);
app.use('/api/reportes',  reporteRoutes);
app.use('/api/archivos',  archivoRoutes);

// Ruta no encontrada (404)
app.use((req, res) => {
    res.status(404).json({ error: `Ruta ${req.method} ${req.originalUrl} no encontrada` });
});

// Manejo global de errores
app.use((err, req, res, next) => {
    console.error('Error no controlado:', err);
    res.status(500).json({ error: 'Error interno del servidor', detalle: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});