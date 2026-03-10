const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Resena = require('../models/resena');
const Restaurante = require('../models/restaurante');

// POST /api/resenas
// Crea una reseña y recalcula calificacion_prom del restaurante (transacción)
router.post('/', async (req, res) => {
    const { usuario_id, restaurante_id, orden_id, calificacion, titulo, comentario, tags } = req.body;

    if (!mongoose.Types.ObjectId.isValid(restaurante_id)) {
        return res.status(400).json({ error: 'restaurante_id inválido' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Crear la reseña
        const nuevaResena = new Resena({
            usuario_id,
            restaurante_id,
            orden_id: orden_id || undefined,
            calificacion,
            titulo,
            comentario,
            tags: tags || []
        });
        await nuevaResena.save({ session });

        // 2. Recalcular el promedio de calificación del restaurante usando agregación
        //    Se hace dentro de la misma sesión para garantizar consistencia
        const resultado = await Resena.aggregate([
            { $match: { restaurante_id: new mongoose.Types.ObjectId(restaurante_id) } },
            { $group: { _id: null, promedio: { $avg: '$calificacion' } } }
        ]).session(session);

        const nuevoProm = resultado.length > 0
            ? Math.round(resultado[0].promedio * 100) / 100
            : calificacion;

        // 3. Actualizar calificacion_prom en el restaurante
        await Restaurante.findByIdAndUpdate(
            restaurante_id,
            { $set: { calificacion_prom: nuevoProm } },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            mensaje: 'Reseña creada exitosamente',
            resena: nuevaResena,
            calificacion_prom_actualizada: nuevoProm
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error en transacción de reseña:', error);
        res.status(500).json({ error: 'No se pudo crear la reseña', detalle: error.message });
    }
});

module.exports = router;
