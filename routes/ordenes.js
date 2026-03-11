const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Orden = require('../models/orden');
const ArticuloMenu = require('../models/articulomenu');

// POST /api/ordenes: Crear orden y actualizar contador de ventas (Transacción ACID)
router.post('/', async (req, res) => {
    const { usuario_id, restaurante_id, articulos, total, direccion_entrega, metodo_pago, notas } = req.body;

    // Iniciar Sesión para la transacción
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Crear la nueva orden atada a la sesión actual
        const nuevaOrden = new Orden({
            usuario_id,
            restaurante_id,
            articulos,
            total,
            direccion_entrega,
            metodo_pago,
            notas,
            estado: 'pendiente'
        });

        // Historial inicial
        nuevaOrden.historial_estados.push({ estado: 'pendiente', nota: 'Orden recibida' });

        await nuevaOrden.save({ session });

        // 2. Actualizar el contador de ventas por cada artículo del menú (ventas_total)
        if (articulos && articulos.length > 0) {
            for (const item of articulos) {
                if (item.articulo_id) {
                    await ArticuloMenu.findByIdAndUpdate(
                        item.articulo_id,
                        { $inc: { ventas_total: item.cantidad } },
                        { session, new: true }
                    );
                }
            }
        }

        // 3. Confirmar la transacción
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ mensaje: 'Orden creada exitosamente', orden: nuevaOrden });
    } catch (error) {
        // Si hay cualquier error, revertir los cambios
        await session.abortTransaction();
        session.endSession();
        console.error("Error en la transacción multi-documento de ordenes:", error);
        res.status(500).json({ error: 'No se pudo procesar la orden', detalle: error.message });
    }
});

// GET /api/ordenes/conteo-estados: Agrupar por estado y contar
router.get('/conteo-estados', async (req, res) => {
    try {
        const conteo = await Orden.aggregate([
            {
                // Agrupar órdenes según su campo "estado"
                $group: {
                    _id: "$estado",
                    // Contar cuántos documentos entran en este grupo
                    total_ordenes: { $sum: 1 }
                }
            },
            {
                // Ordenar por las más numerosas
                $sort: { total_ordenes: -1 }
            }
        ]);

        res.json(conteo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al calcular las estadísticas de órdenes' });
    }
});

// GET /api/ordenes/:id — Obtener una orden con lookup a usuario y restaurante
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        const resultado = await Orden.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            {
                $lookup: {
                    from: 'usuarios',
                    localField: 'usuario_id',
                    foreignField: '_id',
                    as: 'usuario'
                }
            },
            {
                $lookup: {
                    from: 'restaurantes',
                    localField: 'restaurante_id',
                    foreignField: '_id',
                    as: 'restaurante'
                }
            },
            { $unwind: { path: '$usuario', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$restaurante', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    articulos: 1, estado: 1, total: 1, creado_en: 1,
                    'usuario.nombre': 1, 'usuario.email': 1,
                    'restaurante.nombre': 1, 'restaurante.direccion': 1
                }
            }
        ]);
        if (!resultado.length) return res.status(404).json({ error: 'Orden no encontrada' });
        res.json(resultado[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener la orden' });
    }
});

// PATCH /api/ordenes/cancelar-pendientes — Actualizar varias órdenes (updateMany)
router.patch('/cancelar-pendientes', async (req, res) => {
    try {
        const { restaurante_id } = req.body;
        const filtro = { estado: 'pendiente' };
        if (restaurante_id && mongoose.Types.ObjectId.isValid(restaurante_id)) filtro.restaurante_id = restaurante_id;
        const result = await Orden.updateMany(
            filtro,
            { $set: { estado: 'cancelada', actualizado_en: new Date() }, $push: { historial_estados: { estado: 'cancelada', nota: 'Cancelación masiva', timestamp: new Date() } } }
        );
        res.json({ mensaje: 'Órdenes actualizadas', modifiedCount: result.modifiedCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar' });
    }
});

// DELETE /api/ordenes/:id — Eliminar una orden
router.delete('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        const r = await Orden.findByIdAndDelete(req.params.id);
        if (!r) return res.status(404).json({ error: 'Orden no encontrada' });
        res.json({ mensaje: 'Orden eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

// PATCH /api/ordenes/:id/estado — Actualizar estado y agregar al historial
router.patch('/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, nota } = req.body;

        const estadosValidos = ['pendiente', 'en preparacion', 'camino', 'entregada', 'cancelada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ error: 'Estado inválido', estadosValidos });
        }

        const orden = await Orden.findByIdAndUpdate(
            id,
            {
                $set: { estado, actualizado_en: new Date() },
                $push: { historial_estados: { estado, nota: nota || '', timestamp: new Date() } }
            },
            { new: true }
        );

        if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
        res.json({ mensaje: 'Estado actualizado', orden });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el estado' });
    }
});
module.exports = router;
