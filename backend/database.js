
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Ruta donde se almacenará la base de datos.
const rutaDB = path.join(__dirname, "citas.db");

// Crear o abrir la base de datos SQLite.
const db = new sqlite3.Database(rutaDB, (error) => {
    if (error) {
        console.error("Error al conectar SQLite:", error.message);
    } else {
        console.log("Base de datos SQLite conectada.");
    }
});

// Crear la tabla de usuarios.
db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        correo TEXT NOT NULL UNIQUE,
        contrasena_hash TEXT NOT NULL
    )
`);

// Crear la tabla de pacientes.
db.run(`
    CREATE TABLE IF NOT EXISTS pacientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        documento TEXT NOT NULL UNIQUE,
        edad INTEGER,
        telefono TEXT,
        correo TEXT
    )
`);

// Crear la tabla de citas médicas.
db.run(`
    CREATE TABLE IF NOT EXISTS citas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_id INTEGER NOT NULL,
        fecha TEXT NOT NULL,
        hora TEXT NOT NULL,
        motivo TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'Programada',
        FOREIGN KEY (paciente_id)
            REFERENCES pacientes(id)
    )
`);

// Exportar la conexión para utilizarla en otros archivos.
module.exports = db;
