# Delivery App - Backend API

Este sistema ha sido diseñado como un ejercicio práctico para implementar y aprovechar las características avanzadas de MongoDB en un entorno de producción simulado.

El proyecto destaca por la implementación de operaciones complejas en bases de datos NoSQL, incluyendo arquitecturas basadas en índices geoespaciales, transacciones multi-documento para garantizar propiedades ACID, y el uso extenso del framework de agregación para el análisis de datos masivos.

---

## 🛠️ Stack Tecnológico

El proyecto está desarrollado sobre el entorno de ejecución Node.js y utiliza bases de datos documentales:
* **Node.js** con el framework **Express** para el manejo de rutas y la creación de la API REST.
* **MongoDB** como sistema gestor de la base de datos NoSQL.
* **Mongoose** como Object Data Modeling para el manejo estructurado de esquemas y validaciones.
* **Multer** para la recepción de archivos binarios antes de persistirlos en GridFS.
* **Faker.js** empleado para la generación dinámica de aproximadamente 60k registros de prueba.

---

## Guía de Instalación y Ejecución

Para desplegar y ejecutar este proyecto en un entorno local, seguí las siguientes instrucciones:

1. **Instalación de Dependencias:**
   En la terminal en el directorio raíz del proyecto, ejecutá:
   ```bash
   npm install
   ```
   Si `multer` no queda incluido automáticamente, instalalo por separado:
   ```bash
   npm install multer
   ```

2. **Configuración de Variables de Entorno:**
   Es necesario crear un archivo `.env` en la raíz del proyecto para definir la cadena de conexión a la base de datos y el puerto del servidor. La estructura debe ser la siguiente:
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://<usuario>:<password>@cluster0.xxxxx.mongodb.net/nombre_de_tu_base?retryWrites=true&w=majority
   ```

3. **Inyección de Datos (Data Seeding):**
   El proyecto incluye un script de automatización (`seed.js`) diseñado para limpiar el entorno y generar un volumen representativo de datos (500 usuarios, 100 restaurantes parametrizados en la Ciudad de Guatemala, 1,000 artículos de menú, 10,000 reseñas y 50,000 órdenes). Ejecute el siguiente comando y espere su finalización:
   ```bash
   node seed.js
   ```

4. **Inicialización del Servidor:**
   Iniciá la API REST ejecutando el siguiente comando:
   ```bash
   node app.js
   ```
   Confirmará su inicio exitoso con el mensaje _"Servidor corriendo en el puerto 3000"_. 

---

## 📡 Documentación de Endpoints

La API expone once endpoints diseñados para interactuar con las lógicas avanzadas de MongoDB gestionadas por el ODM Mongoose.

### 1. Crear Restaurante
Registra un nuevo restaurante en el sistema. Para adjuntar una imagen, primero subila con el endpoint `/api/archivos` y luego incluí el `imagen_id` devuelto en el cuerpo de esta solicitud.
* **Ruta:** `POST /api/restaurantes`
* **Cuerpo de Solicitud (JSON):** `nombre`, `descripcion`, `direccion`, `ubicacion` (GeoJSON), `categorias`, `imagen_id` (opcional).

### 2. Búsqueda Geoespacial
Aprovecha el poder del índice geoespacial `2dsphere` para retornar los restaurantes ubicados dentro de un radio geográfico específico desde un punto de origen.
* **Ruta:** `GET /api/restaurantes/cerca?lng=-90.5&lat=14.6&maxDistance=5000`
* **Parámetros de Consulta (Query):**
  * `lng`: Longitud de origen.
  * `lat`: Latitud de origen.
  * `maxDistance`: Radio máximo de búsqueda expresado en metros (default: 5000).

### 3. Búsqueda Full-Text
Realiza búsquedas por nombre o descripción de restaurante aprovechando el índice de texto (`$text`) con ponderación de relevancia (el campo `nombre` tiene el doble de peso que `descripcion`).
* **Ruta:** `GET /api/restaurantes/buscar?q=pizza`
* **Parámetros de Consulta (Query):**
  * `q`: Término o frase a buscar (requerido).

### 4. Menú de Restaurante
Retorna los artículos del menú de un restaurante específico con soporte completo de filtros, ordenamiento y paginación.
* **Ruta:** `GET /api/restaurantes/:id/menu`
* **Parámetros de Consulta (Query):**
  * `categoria`: Filtrar por categoría (ej. `postre`, `bebida`).
  * `disponible`: Filtrar por disponibilidad (`true` / `false`).
  * `sort`: Campo por el que ordenar (default: `nombre`).
  * `order`: Dirección del ordenamiento, `1` ascendente o `-1` descendente (default: `1`).
  * `skip`: Documentos a omitir para paginación (default: `0`).
  * `limit`: Documentos a retornar, máximo 100 (default: `20`).

### 5. Transacción Multi-Documento (Creación de Órdenes)
Simula el registro de una nueva orden implementando el control de concurrencia con **Mongoose Sessions (`startSession`)**. El flujo asegura propiedades ACID al crear la orden y, simultáneamente, actualizar los contadores estadísticos (`ventas_total`) de cada platillo involucrado. Si ocurre cualquier anomalía, el sistema revierte todos los cambios (`Abort Transaction / Rollback`).
* **Ruta:** `POST /api/ordenes`
* **Cuerpo de Solicitud (JSON):** Requiere IDs válidos del sistema (`usuario_id`, `restaurante_id`) y una matriz estructurada con el detalle de los `articulos`.

### 6. Actualización de Estado de Orden
Actualiza el estado de una orden existente y registra automáticamente la transición en el array `historial_estados` usando el operador `$push`.
* **Ruta:** `PATCH /api/ordenes/:id/estado`
* **Cuerpo de Solicitud (JSON):**
  * `estado`: Nuevo estado. Valores aceptados: `pendiente`, `en preparacion`, `camino`, `entregada`, `cancelada`.
  * `nota`: Nota opcional sobre la transición.

### 7. Historial Paginado de Órdenes del Usuario
Retorna el historial de órdenes de un usuario ordenado por fecha descendente. Aprovecha el índice compuesto `{ usuario_id: 1, creado_en: -1 }` para máxima eficiencia sobre los 50,000 documentos.
* **Ruta:** `GET /api/usuarios/:id/ordenes`
* **Parámetros de Consulta (Query):**
  * `page`: Número de página (default: `1`).
  * `limit`: Resultados por página, máximo 50 (default: `10`).

### 8. Transacción Multi-Documento (Creación de Reseña)
Crea una reseña y, dentro de la misma transacción ACID, recalcula y actualiza el campo `calificacion_prom` del restaurante evaluado. Garantiza que el promedio nunca quede desactualizado ante fallos parciales.
* **Ruta:** `POST /api/resenas`
* **Cuerpo de Solicitud (JSON):** `usuario_id`, `restaurante_id`, `calificacion` (1–5), `titulo`, `comentario`. Campos opcionales: `orden_id`, `tags`.

### 9. Pipeline de Agregación: Top 5 Restaurantes
Proceso analítico que concatena los operadores `$group`, `$match`, `$sort`, `$limit` y `$lookup` para evaluar todas las reseñas del sistema y determinar los cinco restaurantes mejor calificados, filtrando únicamente los que acumulan al menos 10 reseñas.
* **Ruta:** `GET /api/reportes/top-restaurantes`

### 10. Pipeline de Agregación: Platillos Más Vendidos
Utiliza el campo `ventas_total` (mantenido por la transacción de creación de órdenes) para retornar los platillos con mayor volumen de ventas. Admite filtro opcional por restaurante.
* **Ruta:** `GET /api/reportes/platillos-mas-vendidos`
* **Parámetros de Consulta (Query):**
  * `restaurante_id`: Filtrar por restaurante (opcional).
  * `limit`: Número de resultados, máximo 50 (default: `10`).

### 11. Segmentación Estadística de Órdenes
Genera un análisis del comportamiento de transacciones. Mediante `$group` y `$sum`, clasifica la base total de 50,000 órdenes según su estado actual.
* **Ruta:** `GET /api/ordenes/conteo-estados`

### 12. Gestión de Archivos (GridFS)
Permite subir y recuperar imágenes almacenadas directamente en MongoDB mediante GridFS, evitando dependencias de almacenamiento externo.
* **Subir imagen:** `POST /api/archivos` — Multipart form-data con el campo `imagen` (máx. 5 MB). Devuelve el `imagen_id` para asociarlo a restaurantes o artículos del menú.
* **Ver/descargar imagen:** `GET /api/archivos/:id` — Hace streaming de la imagen directamente desde GridFS.
