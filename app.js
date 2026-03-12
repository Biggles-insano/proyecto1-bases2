const express = require('express');
const path = require('path');
const conectarDB = require('./db');
const restauranteRoutes = require('./routes/restaurantes');
const ordenRoutes = require('./routes/ordenes');
const usuarioRoutes = require('./routes/usuarios');
const resenaRoutes  = require('./routes/resenas');
const reporteRoutes = require('./routes/reportes');
const archivoRoutes = require('./routes/archivos');
const Usuario = require('./models/usuario');
const Restaurante = require('./models/restaurante');
const ArticuloMenu = require('./models/articulomenu');
const Orden = require('./models/orden');
const Resena = require('./models/resena');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a la base de datos
conectarDB();

// Endpoint utilitario: devuelve IDs reales para usar en el frontend
app.get('/api/test-data', async (req, res) => {
    try {
        const usuario     = await Usuario.findOne().select('_id nombre email');
        const restaurante = await Restaurante.findOne().select('_id nombre');
        const articulo    = await ArticuloMenu.findOne({ restaurante_id: restaurante._id }).select('_id nombre precio');
        const orden       = await Orden.findOne({ usuario_id: usuario._id }).select('_id estado');
        const resena      = await Resena.findOne({ restaurante_id: restaurante._id }).select('_id titulo');
        res.json({ usuario, restaurante, articulo, orden, resena });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

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