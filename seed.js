const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Usuario = require('./models/usuario');
const Restaurante = require('./models/restaurante');
const ArticuloMenu = require('./models/articulomenu');
const Orden = require('./models/orden');
const Resena = require('./models/resena');
require('dotenv').config();

async function seedCompleto() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log("Limpiando la base de datos...");
        await Usuario.deleteMany({});
        await Restaurante.deleteMany({});
        await ArticuloMenu.deleteMany({});
        await Orden.deleteMany({});
        await Resena.deleteMany({});

        console.log("Iniciando Seeding Total...");

        // 1. Usuarios
        const usuariosData = Array.from({ length: 500 }, () => ({
            nombre: faker.person.fullName(),
            email: faker.internet.email(),
            password_hash: "hola_123",
            rol: faker.helpers.arrayElement(['cliente', 'admin']),
            activo: true
        }));
        const usuarios = await Usuario.insertMany(usuariosData);
        console.log("Usuarios creados");

        // 2. Restaurantes
        const restaurantesData = Array.from({ length: 100 }, () => ({
            nombre: faker.company.name(),
            ubicacion: {
                type: 'Point',
                coordinates: [
                    faker.location.longitude({ min: -90.55, max: -90.45 }), // Longitud (Ciudad de Guatemala central)
                    faker.location.latitude({ min: 14.58, max: 14.65 })     // Latitud (Ciudad de Guatemala central)
                ]
            },
            categorias: [faker.helpers.arrayElement(['italiana', 'pizza', 'hamburguesas', 'chapina', 'asiatica', 'mexicana'])],
            activo: true
        }));
        const restaurantes = await Restaurante.insertMany(restaurantesData);
        console.log("Restaurantes creados");

        // 3. Artículos de menú 
        const articulosData = Array.from({ length: 1000 }, () => ({
            restaurante_id: faker.helpers.arrayElement(restaurantes)._id,
            nombre: faker.food.dish(),
            precio: faker.number.int({ min: 40, max: 150 }),
            categoria: faker.helpers.arrayElement(['entrada', 'plato fuerte', 'bebida', 'postre', 'sopa']),
            disponible: true
        }));
        const articulos = await ArticuloMenu.insertMany(articulosData);
        console.log("Menú listo");

        // Agrupar menú por restaurante para asignar a las órdenes reales
        const menuPorRestaurante = {};
        articulos.forEach(art => {
            const rId = art.restaurante_id.toString();
            if (!menuPorRestaurante[rId]) menuPorRestaurante[rId] = [];
            menuPorRestaurante[rId].push(art);
        });

        // 4. Órdenes 
        const totalOrdenes = 50000;
        const batchSize = 1000;
        for (let i = 0; i < totalOrdenes / batchSize; i++) {
            const batch = Array.from({ length: batchSize }, () => {
                const res = faker.helpers.arrayElement(restaurantes);
                const rId = res._id.toString();

                // Obtener el menú del restaurante o un fallback
                const fallbackItem = {
                    _id: new mongoose.Types.ObjectId(),
                    nombre: faker.food.dish(),
                    precio: faker.number.int({ min: 40, max: 150 })
                };
                const resMenu = menuPorRestaurante[rId] || [fallbackItem];

                const numItems = faker.number.int({ min: 1, max: 4 });
                const selectedItems = faker.helpers.arrayElements(resMenu, Math.min(numItems, resMenu.length));

                let totalOrden = 0;
                const ordenArticulos = selectedItems.map(item => {
                    const cant = faker.number.int({ min: 1, max: 3 });
                    totalOrden += item.precio * cant;
                    return {
                        articulo_id: item._id,
                        nombre: item.nombre,
                        precio: item.precio,
                        cantidad: cant,
                        notas: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.2 })
                    };
                });

                return {
                    usuario_id: faker.helpers.arrayElement(usuarios)._id,
                    restaurante_id: res._id,
                    articulos: ordenArticulos,
                    total: totalOrden,
                    estado: faker.helpers.arrayElement(['pendiente', 'en preparacion', 'camino', 'entregada', 'cancelada']),
                    direccion_entrega: {
                        calle: faker.location.streetAddress(),
                        zona: faker.helpers.arrayElement(['Zona 1', 'Zona 4', 'Zona 9', 'Zona 10', 'Zona 14', 'Zona 15']),
                        ciudad: 'Ciudad de Guatemala'
                    },
                    metodo_pago: faker.helpers.arrayElement(['efectivo', 'tarjeta', 'transferencia']),
                    creado_en: faker.date.recent({ days: 60 })
                };
            });
            await Orden.insertMany(batch);
        }
        console.log("50,000 Órdenes creadas");

        // 5. Reseñas 
        const resenasData = Array.from({ length: 10000 }, () => ({
            usuario_id: faker.helpers.arrayElement(usuarios)._id,
            restaurante_id: faker.helpers.arrayElement(restaurantes)._id,
            calificacion: faker.number.int({ min: 1, max: 5 }),
            titulo: "Excelente servicio",
            comentario: faker.lorem.sentence()
        }));
        await Resena.insertMany(resenasData);
        console.log("Reseñas creadas");

        console.log("PROCESO FINALIZADO EXITOSAMENTE");
        process.exit();
    } catch (err) {
        console.error("Error en el seeding:", err);
        process.exit(1);
    }
}

seedCompleto();