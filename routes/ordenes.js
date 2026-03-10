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

module.exports = router;
