
require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);

// Conexión con la base de datos.
require("./backend/database");

// Importar los módulos.
const pacientesRoutes = require("./backend/pacientes");
const citasRoutes = require("./backend/citas");
const usuariosRoutes = require("./backend/usuarios");

const app = express();
const PORT = 3000;

// Comprobar que existe la clave de sesión.
if (!process.env.SESSION_SECRET) {
    throw new Error("Falta SESSION_SECRET en .env");
}

// Permitir recibir datos JSON.
app.use(express.json());

// Configurar las sesiones de usuario.
app.use(session({
    store: new SQLiteStore({
        db: "sesiones.db",
        dir: path.join(__dirname, "backend")
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 1000
    }
}));

// Proteger la página del Dashboard.
app.get("/dashboard.html", (req, res) => {
    if (!req.session.usuarioId) {
        return res.redirect("/");
    }

    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Archivos de la interfaz web.
app.use(express.static(path.join(__dirname, "public"), {
    index: "index.html"
}));

// Rutas de la aplicación.
app.use("/api/pacientes", pacientesRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/usuarios", usuariosRoutes);

// Comprobar funcionamiento del servidor.
app.get("/api/estado", (req, res) => {
    res.json({
        mensaje: "Servidor funcionando correctamente"
    });
});

// Iniciar el servidor.
const servidor = app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});

servidor.on("error", (error) => {
    console.error("Error del servidor:", error.message);
});
