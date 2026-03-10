const express = require('express');
const router = express.Router();
const Restaurante = require('../models/restaurante');
const Resena = require('../models/resena');
const mongoose = require('mongoose');
const ArticuloMenu = require('../models/articulomenu');

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

// POST /api/restaurantes — Crear restaurante (la imagen se sube aparte con /api/archivos)
router.post('/', async (req, res) => {
    try {
        const nuevoRestaurante = new Restaurante(req.body);
        await nuevoRestaurante.save();
        res.status(201).json({ mensaje: 'Restaurante creado', restaurante: nuevoRestaurante });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el restaurante', detalle: error.message });
    }
});

// GET /api/restaurantes/buscar?q=pizza — Búsqueda full-text ($text)
router.get('/buscar', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: 'Parámetro q requerido' });

        const resultados = await Restaurante.find(
            { $text: { $search: q } },
            { score: { $meta: 'textScore' } }   // incluir score de relevancia
        )
        .sort({ score: { $meta: 'textScore' } }) // ordenar por relevancia
        .limit(20);

        res.json(resultados);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en la búsqueda full-text' });
    }
});

// GET /api/restaurantes/:id/menu — Menú con filtros, sort, skip, limit
router.get('/:id/menu', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID de restaurante inválido' });
        }

        const { categoria, disponible, sort = 'nombre', order = '1', skip = 0, limit = 20 } = req.query;
        const filtro = { restaurante_id: id };
        if (categoria) filtro.categoria = categoria;
        if (disponible !== undefined) filtro.disponible = disponible === 'true';

        const articulos = await ArticuloMenu
            .find(filtro)
            .sort({ [sort]: parseInt(order) })
            .skip(parseInt(skip))
            .limit(Math.min(100, parseInt(limit)));

        const total = await ArticuloMenu.countDocuments(filtro);
        res.json({ total, articulos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el menú' });
    }
});

module.exports = router;
