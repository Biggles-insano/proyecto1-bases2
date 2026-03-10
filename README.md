# Delivery App - Backend API

Este sistema ha sido diseñado como un ejercicio práctico para implementar y aprovechar las características avanzadas de MongoDB en un entorno de producción simulado.

El proyecto destaca por la implementación de operaciones complejas en bases de datos NoSQL, incluyendo arquitecturas basadas en índices geoespaciales, transacciones multi-documento para garantizar propiedades ACID, y el uso extenso del framework de agregación para el análisis de datos masivos.

---

## 🛠️ Stack Tecnológico

El proyecto está desarrollado sobre el entorno de ejecución Node.js y utiliza bases de datos documentales:
* **Node.js** con el framework **Express** para el manejo de rutas y la creación de la API REST.
* **MongoDB** como sistema gestor de la base de datos NoSQL.
* **Mongoose** como Object Data Modeling para el manejo estructurado de esquemas y validaciones.
* **Faker.js** empleado para la generación dinámica de aproximadamente 50k registros de prueba.

---

## Guía de Instalación y Ejecución

Para desplegar y ejecutar este proyecto en un entorno local, seguí las siguientes instrucciones:

1. **Instalación de Dependencias:**
   En la terminal en el directorio raíz del proyecto, ejecutá:
   ```bash
   npm install
   ```

2. **Configuración de Variables de Entorno:**
   Es necesario crear un archivo `.env` en la raíz del proyecto para definir la cadena de conexión a la base de datos y el puerto del servidor. La estructura debe ser la siguiente:
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://<usuario>:<password>@cluster0.xxxxx.mongodb.net/nombre_de_tu_base?retryWrites=true&w=majority
   ```

3. **Inyección de Datos (Data Seeding):**
   El proyecto incluye un script de automatización (`seed.js`) diseñado para limpiar el entorno y generar un volumen representativo de datos (500 usuarios, 100 restaurantes parametrizados en la Ciudad de Guatemala, 10,000 reseñas y 50,000 órdenes). Ejecute el siguiente comando y espere su finalización:
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

La API expone cuatro endpoints principales diseñados específicamente para interactuar con las lógicas avanzadas de MongoDB gestionadas por el ODM Mongoose.

### 1. Búsqueda Geoespacial
Aprovecha el poder del índice geoespacial `2dsphere` para retornar los restaurantes ubicados dentro de un ratio geográfico específico desde un punto de origen.
* **Ruta:** `GET /api/restaurantes/cerca?lng=-90.5&lat=14.6&maxDistance=5000`
* **Parámetros de Consulta (Query):** 
  * `lng`: Longitud de origen.
  * `lat`: Latitud de origen.
  * `maxDistance`: Radio máximo de búsqueda expresado en metros.

### 2. Transacción Multi-Documento (Creación de Órdenes)
Simula el registro de una nueva orden implementando el control de concurrencia **Mongoose Sessions (`startSession`)**. El flujo asegura propiedades ACID al crear la orden y, simultáneamente, actualizar los contadores estadísticos de los platillos. Si ocurre una anomalía, el sistema revierte todos los cambios (`Abort Transaction / Rollback`).
* **Ruta:** `POST /api/ordenes`
* **Cuerpo de Solicitud (JSON):** Requiere IDs válidos del sistema (`usuario_id`, `restaurante_id`) y una matriz estructurada con el detalle de los `articulos`.

### 3. Pipeline de Agregación: Evaluación de Restaurantes
Un proceso analítico de alta demanda computacional que concatena operadores de agregación (`$group`, `$match`, `$sort`, `$limit`, `$lookup`). Éste, procesa y evalúa todas las reseñas del sistema para dictaminar un Top 5 de los restaurantes mejor calificados del servicio, integrando la información relacional hacia la colección principal de restaurantes.
* **Ruta:** `GET /api/restaurantes/top`

### 4. Segmentación Estadística de Órdenes
Genera un análisis rápido del comportamiento de transacciones. Mediante operadores de agrupamiento y totalización simultánea (`$group` y contador aritmético con `$sum`), clasifica la base total de 50,000 órdenes según su estado actual ("entregada", "cancelada", etc.).
* **Ruta:** `GET /api/ordenes/conteo-estados`
