const mongoose = require('mongoose');
require('dotenv').config();
const Usuario = require('./models/usuario');
const Restaurante = require('./models/restaurante');
const ArticuloMenu = require('./models/articulomenu');

async function getTestData() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await Usuario.findOne();
    const rest = await Restaurante.findOne();
    const art = await ArticuloMenu.findOne({ restaurante_id: rest._id });
    
    console.log(JSON.stringify({
        usuario_id: user._id,
        restaurante_id: rest._id,
        articulo: {
            articulo_id: art._id,
            nombre: art.nombre,
            precio: art.precio
        }
    }, null, 2));
    
    process.exit(0);
}
getTestData();
