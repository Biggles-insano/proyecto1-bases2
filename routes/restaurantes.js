const express = require('express');
const router = express.Router();
const Restaurante = require('../models/restaurante');
const Resena = require('../models/resena');

// GET /api/restaurantes/cerca: Búsqueda por ubicación
router.get('/cerca', async (req, res) => {
    try {
        const { lng, lat, maxDistance = 5000 } = req.query;

        if (!lng || !lat) {
            return res.status(400).json({ error: 'Faltan coordenadas lng y lat en la consulta.' });
        }

        const restaurantes = await Restaurante.find({
            ubicacion: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            }
        });

        res.json(restaurantes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al buscar restaurantes cercanos' });
    }
});

// GET /api/restaurantes/top: Top 5 Restaurantes
router.get('/top', async (req, res) => {
    try {
        const topRestaurantes = await Resena.aggregate([
            {
                // Agrupar reseñas por restaurante
                $group: {
                    _id: "$restaurante_id",
                    promedioCalificacion: { $avg: "$calificacion" },
                    totalResenas: { $sum: 1 }
                }
            },
            {
                // Filtrar los que tienen al menos 10 reseñas
                $match: {
                    totalResenas: { $gte: 10 }
                }
            },
            {
                // Ordenar por promedio descendente
                $sort: { promedioCalificacion: -1 }
            },
            {
                // Limitar a los Top 5
                $limit: 5
            },
            {
                // Hacer el JOIN con la colección de restaurantes
                $lookup: {
                    from: "restaurantes", // El nombre de la colección real en MongoDB
                    localField: "_id",
                    foreignField: "_id",
                    as: "detallesRestaurante"
                }
            },
            {
                // Desenrollar el array del lookup para integrar el objeto
                $unwind: "$detallesRestaurante"
            },
            {
                // Proyectar los campos que queremos devolver
                $project: {
                    _id: 1,
                    promedioCalificacion: { $round: ["$promedioCalificacion", 2] },
                    totalResenas: 1,
                    nombre: "$detallesRestaurante.nombre",
                    categorias: "$detallesRestaurante.categorias",
                    direccion: "$detallesRestaurante.direccion"
                }
            }
        ]);

        res.json(topRestaurantes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al calcular el top de restaurantes' });
    }
});

module.exports = router;
