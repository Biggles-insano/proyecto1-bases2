const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const { Readable } = require('stream');

// Multer con almacenamiento en memoria (el buffer se sube luego a GridFS)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'), false);
        }
    }
});

// Helper para obtener el bucket de GridFS usando la conexión activa de Mongoose
function getBucket() {
    const db = mongoose.connection.db;
    return new GridFSBucket(db, { bucketName: 'imagenes' });
}

// POST /api/archivos
// Sube una imagen a GridFS y devuelve el ObjectId del archivo
router.post('/', upload.single('imagen'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó ningún archivo de imagen' });
    }

    try {
        const bucket = getBucket();
        const filename = `${Date.now()}-${req.file.originalname}`;

        // Convertir el buffer en un stream legible y subirlo a GridFS
        const uploadStream = bucket.openUploadStream(filename, {
            contentType: req.file.mimetype,
            metadata: { uploadedBy: req.body.usuario_id || 'desconocido' }
        });

        const readable = Readable.from(req.file.buffer);
        readable.pipe(uploadStream);

        uploadStream.on('finish', () => {
            res.status(201).json({
                mensaje: 'Imagen subida exitosamente',
                imagen_id: uploadStream.id,
                filename
            });
        });

        uploadStream.on('error', (err) => {
            console.error('Error al subir a GridFS:', err);
            res.status(500).json({ error: 'Error al guardar la imagen' });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno al procesar la imagen' });
    }
});

// GET /api/archivos/:id
// Descarga/visualiza una imagen desde GridFS por su ObjectId
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID de archivo inválido' });
        }

        const bucket = getBucket();
        const objectId = new mongoose.Types.ObjectId(id);

        // Verificar que el archivo exista antes de hacer streaming
        const archivos = await bucket.find({ _id: objectId }).toArray();
        if (!archivos || archivos.length === 0) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        const archivo = archivos[0];

        // Configurar cabeceras para que el navegador pueda mostrar la imagen
        res.set('Content-Type', archivo.contentType || 'image/jpeg');
        res.set('Content-Length', archivo.length);

        // Hacer streaming del archivo desde GridFS a la respuesta HTTP
        const downloadStream = bucket.openDownloadStream(objectId);
        downloadStream.pipe(res);

        downloadStream.on('error', () => {
            res.status(404).json({ error: 'No se pudo leer el archivo' });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el archivo' });
    }
});

module.exports = router;
