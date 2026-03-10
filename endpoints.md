# 📡 Guía de Endpoints — Delivery App

Base URL: `http://localhost:3000/api`

> Para los GET podés usar el navegador directo. Para POST y PATCH necesitás Postman o Thunder Client.

---

## 🍽️ Restaurantes

### `GET /restaurantes/cerca`
```
http://localhost:3000/api/restaurantes/cerca?lng=-90.5069&lat=14.6105&maxDistance=5000
```

### `GET /restaurantes/buscar`
```
http://localhost:3000/api/restaurantes/buscar?q=pizza
```

### `GET /restaurantes/:id/menu`
```
http://localhost:3000/api/restaurantes/<id>/menu
http://localhost:3000/api/restaurantes/<id>/menu?categoria=postre&sort=precio&order=-1&limit=5
```

### `POST /restaurantes`
```json
POST http://localhost:3000/api/restaurantes
Content-Type: application/json

{
  "nombre": "La Trattoria",
  "descripcion": "Cocina italiana",
  "direccion": { "calle": "6a Av 8-65", "zona": "10", "ciudad": "Guatemala" },
  "ubicacion": { "type": "Point", "coordinates": [-90.5069, 14.6105] },
  "categorias": ["italiana", "pizza"]
}
```

---

## 📦 Órdenes

### `GET /ordenes/conteo-estados`
```
http://localhost:3000/api/ordenes/conteo-estados
```

### `POST /ordenes`
```json
POST http://localhost:3000/api/ordenes
Content-Type: application/json

{
  "usuario_id": "<id>",
  "restaurante_id": "<id>",
  "articulos": [
    { "articulo_id": "<id>", "nombre": "Pizza", "precio": 89, "cantidad": 2 }
  ],
  "total": 178,
  "direccion_entrega": { "calle": "6a Av", "zona": "10", "ciudad": "Guatemala" },
  "metodo_pago": "tarjeta"
}
```

### `PATCH /ordenes/:id/estado`
```json
PATCH http://localhost:3000/api/ordenes/<id>/estado
Content-Type: application/json

{
  "estado": "en preparacion",
  "nota": "Confirmado"
}
```
Estados válidos: `pendiente` · `en preparacion` · `camino` · `entregada` · `cancelada`

---

## 👤 Usuarios

### `GET /usuarios/:id/ordenes`
```
http://localhost:3000/api/usuarios/<id>/ordenes
http://localhost:3000/api/usuarios/<id>/ordenes?page=1&limit=10
```

---

## ⭐ Reseñas

### `POST /resenas`
```json
POST http://localhost:3000/api/resenas
Content-Type: application/json

{
  "usuario_id": "<id>",
  "restaurante_id": "<id>",
  "calificacion": 5,
  "titulo": "Excelente",
  "comentario": "Muy buena comida.",
  "tags": ["rapido", "sabroso"]
}
```

---

## 📊 Reportes

### `GET /reportes/top-restaurantes`
```
http://localhost:3000/api/reportes/top-restaurantes
```

### `GET /reportes/platillos-mas-vendidos`
```
http://localhost:3000/api/reportes/platillos-mas-vendidos
http://localhost:3000/api/reportes/platillos-mas-vendidos?limit=5
http://localhost:3000/api/reportes/platillos-mas-vendidos?restaurante_id=<id>&limit=5
```

---

## 🖼️ Archivos

### `POST /archivos`
```
POST http://localhost:3000/api/archivos
Content-Type: multipart/form-data

campo: imagen → archivo jpg/png (máx 5MB)
```

### `GET /archivos/:id`
```
http://localhost:3000/api/archivos/<imagen_id>
```

---

## 🔑 ¿Cómo conseguir IDs reales?

Corré esto en la consola de MongoDB Atlas:
```js
db.usuarios.findOne({}, { _id: 1 })
db.restaurantes.findOne({}, { _id: 1 })
db.articulos_menu.findOne({}, { _id: 1, restaurante_id: 1 })
db.ordenes.findOne({}, { _id: 1 })
```
