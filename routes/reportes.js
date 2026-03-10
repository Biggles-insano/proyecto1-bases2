const express = require('express');
const router = express.Router();
const Resena = require('../models/resena');
const ArticuloMenu = require('../models/articulomenu');
const Orden = require('../models/orden');

// GET /api/reportes/top-restaurantes
// Aggregation pipeline: Top 5 restaurantes mejor calificados (mínimo 10 reseñas)
router.get('/top-restaurantes', async (req, res) => {
    try {
        const top = await Resena.aggregate([
            {
                $group: {
                    _id: '$restaurante_id',
                    promedioCalificacion: { $avg: '$calificacion' },
                    totalResenas: { $sum: 1 }
                }
            },
            { $match: { totalResenas: { $gte: 10 } } },
            { $sort: { promedioCalificacion: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'restaurantes',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'detalles'
                }
            },
            { $unwind: '$detalles' },
            {
                $project: {
                    _id: 1,
                    promedioCalificacion: { $round: ['$promedioCalificacion', 2] },
                    totalResenas: 1,
                    nombre: '$detalles.nombre',
                    categorias: '$detalles.categorias',
                    direccion: '$detalles.direccion'
                }
            }
        ]);

        res.json(top);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al calcular el top de restaurantes' });
    }
});

// GET /api/reportes/platillos-mas-vendidos
// Aggregation pipeline: Top platillos por total de unidades vendidas
// Query param opcional: ?restaurante_id=xxx para filtrar por restaurante
// Query param opcional: ?limit=10 para cambiar el número de resultados
router.get('/platillos-mas-vendidos', async (req, res) => {
    try {
        const limite = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

        // Usar ventas_total del modelo ArticuloMenu (se incrementa en cada orden via transacción)
        const pipeline = [];

        // Filtro opcional por restaurante
        if (req.query.restaurante_id) {
            const mongoose = require('mongoose');
            if (!mongoose.Types.ObjectId.isValid(req.query.restaurante_id)) {
                return res.status(400).json({ error: 'restaurante_id inválido' });
            }
            pipeline.push({
                $match: {
                    restaurante_id: new mongoose.Types.ObjectId(req.query.restaurante_id),
                    disponible: true
                }
            });
        } else {
            pipeline.push({ $match: { disponible: true } });
        }

        pipeline.push(
            { $sort: { ventas_total: -1 } },
            { $limit: limite },
            {
                $lookup: {
                    from: 'restaurantes',
                    localField: 'restaurante_id',
                    foreignField: '_id',
                    as: 'restaurante'
                }
            },
            { $unwind: { path: '$restaurante', preserveNullAndEmpty: true } },
            {
                $project: {
                    nombre: 1,
                    categoria: 1,
                    precio: 1,
                    ventas_total: 1,
                    ingresos_estimados: { $multiply: ['$precio', '$ventas_total'] },
                    restaurante_nombre: '$restaurante.nombre'
                }
            }
        );

        const platillos = await ArticuloMenu.aggregate(pipeline);
        res.json(platillos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los platillos más vendidos' });
    }
});

module.exports = router;
