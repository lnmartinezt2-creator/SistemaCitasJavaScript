
const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./database");

const router = express.Router();

// REGISTRAR USUARIO.
router.post("/registro", async (req, res) => {
    const { nombre, correo, contrasena } = req.body;

    if (
        typeof nombre !== "string" ||
        !nombre.trim() ||
        typeof correo !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ||
        typeof contrasena !== "string" ||
        contrasena.length < 8
    ) {
        return res.status(400).json({
            mensaje: "Verifica los datos ingresados."
        });
    }

    try {
        const hash = await bcrypt.hash(contrasena, 12);

        db.run(
            `INSERT INTO usuarios
             (nombre, correo, contrasena_hash)
             VALUES (?, ?, ?)`,
            [nombre.trim(), correo.trim().toLowerCase(), hash],
            function (error) {
                if (error) {
                    if (error.code === "SQLITE_CONSTRAINT") {
                        return res.status(409).json({
                            mensaje: "El correo ya está registrado."
                        });
                    }

                    return res.status(500).json({
                        mensaje: "Error al registrar el usuario."
                    });
                }

                res.status(201).json({
                    mensaje: "Usuario registrado correctamente."
                });
            }
        );
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al procesar el registro."
        });
    }
});

// INICIAR SESIÓN.
router.post("/login", (req, res) => {
    const { correo, contrasena } = req.body;

    if (
        typeof correo !== "string" ||
        typeof contrasena !== "string" ||
        !correo.trim() ||
        !contrasena
    ) {
        return res.status(400).json({
            mensaje: "Ingresa tu correo y contraseña."
        });
    }

    db.get(
        "SELECT * FROM usuarios WHERE correo = ?",
        [correo.trim().toLowerCase()],
        async (error, usuario) => {
            if (error) {
                return res.status(500).json({
                    mensaje: "Error al consultar el usuario."
                });
            }

            if (!usuario) {
                return res.status(401).json({
                    mensaje: "Correo o contraseña incorrectos."
                });
            }

            try {
                const valida = await bcrypt.compare(
                    contrasena,
                    usuario.contrasena_hash
                );

                if (!valida) {
                    return res.status(401).json({
                        mensaje: "Correo o contraseña incorrectos."
                    });
                }

                // Renovar la sesión después del ingreso.
                req.session.regenerate((errorSesion) => {
                    if (errorSesion) {
                        return res.status(500).json({
                            mensaje: "No se pudo iniciar la sesión."
                        });
                    }

                    // Guardar el usuario autenticado.
                    req.session.usuarioId = usuario.id;

                    req.session.save((errorGuardar) => {
                        if (errorGuardar) {
                            return res.status(500).json({
                                mensaje: "No se pudo guardar la sesión."
                            });
                        }

                        res.json({
                            mensaje: "Inicio de sesión correcto.",
                            usuario: {
                                id: usuario.id,
                                nombre: usuario.nombre,
                                correo: usuario.correo
                            }
                        });
                    });
                });
            } catch (error) {
                res.status(500).json({
                    mensaje: "Error al verificar la contraseña."
                });
            }
        }
    );
});

// CERRAR SESIÓN.
router.post("/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                mensaje: "No se pudo cerrar la sesión."
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            mensaje: "Sesión cerrada correctamente."
        });
    });
});

// CONSULTAR LA SESIÓN ACTUAL.
router.get("/sesion", (req, res) => {
    if (!req.session.usuarioId) {
        return res.status(401).json({
            mensaje: "No hay una sesión activa."
        });
    }

    res.json({
        autenticado: true,
        usuarioId: req.session.usuarioId
    });
});

module.exports = router;
