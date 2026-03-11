const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Resena = require('../models/resena');
const Restaurante = require('../models/restaurante');

// PATCH /api/resenas/:id/tags — Añadir tag con $addToSet o quitar con $pull
router.patch('/:id/tags', async (req, res) => {
    try {
        const { id } = req.params;
        const { agregar, quitar } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido' });
        let update;
        if (agregar) update = { $addToSet: { tags: agregar } };
        else if (quitar) update = { $pull: { tags: quitar } };
        else return res.status(400).json({ error: 'Enviar "agregar" o "quitar"' });
        const r = await Resena.findByIdAndUpdate(id, update, { new: true });
        if (!r) return res.status(404).json({ error: 'Reseña no encontrada' });
        res.json(r);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar tags' });
    }
});

// DELETE /api/resenas/por-restaurante — Eliminar varias reseñas (deleteMany)
router.delete('/por-restaurante', async (req, res) => {
    try {
        const { restaurante_id } = req.query;
        if (!restaurante_id || !mongoose.Types.ObjectId.isValid(restaurante_id)) {
            return res.status(400).json({ error: 'restaurante_id requerido y válido' });
        }
        const result = await Resena.deleteMany({ restaurante_id });
        res.json({ mensaje: 'Reseñas eliminadas', deletedCount: result.deletedCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

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
