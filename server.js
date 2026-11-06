
const express = require("express");
const path = require("path");

// Inicializar la base de datos SQLite.
require("./backend/database");

// Importar las rutas de pacientes.
const pacientesRoutes = require("./backend/pacientes");

const app = express();
const PORT = 3000;

// Configurar Express.
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Habilitar las rutas de pacientes.
app.use("/api/pacientes", pacientesRoutes);

// Iniciar el servidor.
app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
