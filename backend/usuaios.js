
const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./database");

const router = express.Router();

// Registrar un nuevo usuario.
router.post("/registro", async (req, res) => {
    const { nombre, correo, contrasena } = req.body;

    // Validar los datos recibidos.
    if (
        typeof nombre !== "string" ||
        typeof correo !== "string" ||
        typeof contrasena !== "string" ||
        !nombre.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ||
        contrasena.length < 8
    ) {
        return res.status(400).json({
            mensaje: "Verifica el nombre, correo y contraseña."
        });
    }

    try {
        // Cifrar mediante hash la contraseña.
        const hash = await bcrypt.hash(contrasena, 12);

        // Guardar el usuario en SQLite.
        db.run(
            `INSERT INTO usuarios
             (nombre, correo, contrasena_hash)
             VALUES (?, ?, ?)`,
            [nombre.trim(), correo.trim().toLowerCase(), hash],
            function (error) {
                if (error) {
                    if (error.code === "SQLITE_CONSTRAINT") {
                        return res.status(409).json({
                            mensaje: "Este correo ya está registrado."
                        });
                    }

                    return res.status(500).json({
                        mensaje: "Error al registrar el usuario."
                    });
                }

                res.status(201).json({
                    mensaje: "Cuenta creada correctamente."
                });
            }
        );
    } catch (error) {
        res.status(500).json({
            mensaje: "No se pudo procesar el registro."
        });
    }
});

module.exports = router;
