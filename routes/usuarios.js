const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Orden = require('../models/orden');

// GET /api/usuarios/:id/ordenes
// Historial paginado de órdenes del usuario, ordenado por fecha descendente
router.get('/:id/ordenes', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }

        // Paginación: page (nro de página) y limit (docs por página), con defaults
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        // Usa el índice compuesto { usuario_id: 1, creado_en: -1 }
        const [ordenes, total] = await Promise.all([
            Orden.find({ usuario_id: id })
                .sort({ creado_en: -1 })
                .skip(skip)
                .limit(limit)
                .select('-historial_estados'), // Omitir historial para aligerar respuesta
            Orden.countDocuments({ usuario_id: id })
        ]);

        res.json({
            total,
            page,
            totalPages: Math.ceil(total / limit),
            limit,
            ordenes
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el historial de órdenes' });
    }
});

module.exports = router;
