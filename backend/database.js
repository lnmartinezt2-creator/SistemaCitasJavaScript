
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const rutaDB = path.join(__dirname, "citas.db");


const db = new sqlite3.Database(rutaDB, (error) => {
    if (error) {
        console.error("Error al conectar SQLite:", error.message);
    } else {
        console.log("Base de datos SQLite conectada.");
    }
});


db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        correo TEXT NOT NULL UNIQUE,
        contrasena_hash TEXT NOT NULL
    )
`);


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

db.run(`
    CREATE TABLE IF NOT EXISTS medicos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        especialidad TEXT NOT NULL,
        documento TEXT NOT NULL UNIQUE,
        telefono TEXT,
        correo TEXT
    )
`);


db.run(`
    CREATE TABLE IF NOT EXISTS citas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_id INTEGER NOT NULL,
        medico_id INTEGER,
        fecha TEXT NOT NULL,
        hora TEXT NOT NULL,
        motivo TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'Programada',
        FOREIGN KEY (paciente_id)
            REFERENCES pacientes(id)
    )
`);

db.all("PRAGMA table_info(citas)", (error, columnas) => {
    if (error) {
        console.error("Error al revisar la tabla citas:", error.message);
        return;
    }

    if (!columnas.some((columna) => columna.name === "medico_id")) {
        db.run("ALTER TABLE citas ADD COLUMN medico_id INTEGER", (alterError) => {
            if (alterError) console.error("Error al actualizar la tabla citas:", alterError.message);
        });
    }
});

// Exportar la conexión para utilizarla en otros archivos.
module.exports = db;
