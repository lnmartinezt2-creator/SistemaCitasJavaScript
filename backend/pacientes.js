const express = require("express");
const db = require("./database");

const router = express.Router();

function validarPaciente(datos) {
    const { nombre, documento, edad, telefono, correo } = datos;

    if (
        typeof nombre !== "string" ||
        !nombre.trim() ||
        typeof documento !== "string" ||
        !documento.trim() ||
        !Number.isInteger(edad) ||
        edad < 0 ||
        edad > 120 ||
        (telefono !== undefined && telefono !== null && typeof telefono !== "string") ||
        (correo !== undefined && correo !== null && typeof correo !== "string")
    ) {
        return false;
    }

    return !correo || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

function datosPaciente(body) {
    return {
        nombre: body.nombre.trim(),
        documento: body.documento.trim(),
        edad: body.edad,
        telefono: typeof body.telefono === "string" ? body.telefono.trim() : "",
        correo: typeof body.correo === "string" ? body.correo.trim().toLowerCase() : ""
    };
}

router.get("/", (req, res) => {
    const busqueda = typeof req.query.buscar === "string" ? req.query.buscar.trim() : "";
    const termino = `%${busqueda}%`;

    db.all(
        `SELECT id, nombre, documento, edad, telefono, correo
         FROM pacientes
         WHERE nombre LIKE ? OR documento LIKE ?
         ORDER BY nombre COLLATE NOCASE`,
        [termino, termino],
        (error, pacientes) => {
            if (error) {
                return res.status(500).json({ mensaje: "No se pudieron consultar los pacientes." });
            }

            res.json(pacientes);
        }
    );
});

router.post("/", (req, res) => {
    const paciente = datosPaciente(req.body);

    if (!validarPaciente({ ...req.body, edad: Number(req.body.edad) })) {
        return res.status(400).json({ mensaje: "Verifica los datos del paciente." });
    }

    db.run(
        `INSERT INTO pacientes (nombre, documento, edad, telefono, correo)
         VALUES (?, ?, ?, ?, ?)`,
        [paciente.nombre, paciente.documento, Number(req.body.edad), paciente.telefono, paciente.correo],
        function (error) {
            if (error) {
                if (error.code === "SQLITE_CONSTRAINT") {
                    return res.status(409).json({ mensaje: "El documento ya está registrado." });
                }

                return res.status(500).json({ mensaje: "No se pudo registrar el paciente." });
            }

            res.status(201).json({ id: this.lastID, mensaje: "Paciente registrado correctamente." });
        }
    );
});

router.put("/:id", (req, res) => {
    const paciente = datosPaciente(req.body);

    if (!validarPaciente({ ...req.body, edad: Number(req.body.edad) })) {
        return res.status(400).json({ mensaje: "Verifica los datos del paciente." });
    }

    db.run(
        `UPDATE pacientes
         SET nombre = ?, documento = ?, edad = ?, telefono = ?, correo = ?
         WHERE id = ?`,
        [
            paciente.nombre,
            paciente.documento,
            Number(req.body.edad),
            paciente.telefono,
            paciente.correo,
            req.params.id
        ],
        function (error) {
            if (error) {
                if (error.code === "SQLITE_CONSTRAINT") {
                    return res.status(409).json({ mensaje: "El documento ya está registrado." });
                }

                return res.status(500).json({ mensaje: "No se pudo actualizar el paciente." });
            }

            if (!this.changes) {
                return res.status(404).json({ mensaje: "Paciente no encontrado." });
            }

            res.json({ mensaje: "Paciente actualizado correctamente." });
        }
    );
});

router.delete("/:id", (req, res) => {
    db.run("DELETE FROM pacientes WHERE id = ?", [req.params.id], function (error) {
        if (error) {
            return res.status(500).json({ mensaje: "No se pudo eliminar el paciente." });
        }

        if (!this.changes) {
            return res.status(404).json({ mensaje: "Paciente no encontrado." });
        }

        res.json({ mensaje: "Paciente eliminado correctamente." });
    });
});

module.exports = router;
