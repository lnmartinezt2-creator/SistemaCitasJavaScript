const express = require("express");
const db = require("./database");

const router = express.Router();

function validarMedico(body) {
    return typeof body.nombre === "string" && body.nombre.trim() &&
        typeof body.especialidad === "string" && body.especialidad.trim() &&
        typeof body.documento === "string" && body.documento.trim() &&
        (!body.telefono || typeof body.telefono === "string") &&
        (!body.correo || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.correo));
}

function datosMedico(body) {
    return [
        body.nombre.trim(),
        body.especialidad.trim(),
        body.documento.trim(),
        typeof body.telefono === "string" ? body.telefono.trim() : "",
        typeof body.correo === "string" ? body.correo.trim().toLowerCase() : ""
    ];
}

router.get("/", (req, res) => {
    const buscar = typeof req.query.buscar === "string" ? req.query.buscar.trim() : "";
    const termino = `%${buscar}%`;
    db.all(
        `SELECT id, nombre, especialidad, documento, telefono, correo
         FROM medicos
         WHERE nombre LIKE ? OR especialidad LIKE ? OR documento LIKE ?
         ORDER BY nombre COLLATE NOCASE`,
        [termino, termino, termino],
        (error, medicos) => {
            if (error) return res.status(500).json({ mensaje: "No se pudieron consultar los médicos." });
            res.json(medicos);
        }
    );
});

router.post("/", (req, res) => {
    if (!validarMedico(req.body)) return res.status(400).json({ mensaje: "Verifica los datos del médico." });
    db.run(
        "INSERT INTO medicos (nombre, especialidad, documento, telefono, correo) VALUES (?, ?, ?, ?, ?)",
        datosMedico(req.body),
        function (error) {
            if (error) {
                if (error.code === "SQLITE_CONSTRAINT") return res.status(409).json({ mensaje: "El documento ya está registrado." });
                return res.status(500).json({ mensaje: "No se pudo registrar el médico." });
            }
            res.status(201).json({ id: this.lastID, mensaje: "Médico registrado correctamente." });
        }
    );
});

router.put("/:id", (req, res) => {
    if (!validarMedico(req.body)) return res.status(400).json({ mensaje: "Verifica los datos del médico." });
    db.run(
        `UPDATE medicos SET nombre = ?, especialidad = ?, documento = ?, telefono = ?, correo = ?
         WHERE id = ?`,
        [...datosMedico(req.body), req.params.id],
        function (error) {
            if (error) {
                if (error.code === "SQLITE_CONSTRAINT") return res.status(409).json({ mensaje: "El documento ya está registrado." });
                return res.status(500).json({ mensaje: "No se pudo actualizar el médico." });
            }
            if (!this.changes) return res.status(404).json({ mensaje: "Médico no encontrado." });
            res.json({ mensaje: "Médico actualizado correctamente." });
        }
    );
});

router.delete("/:id", (req, res) => {
    db.run("DELETE FROM medicos WHERE id = ?", [req.params.id], function (error) {
        if (error) return res.status(500).json({ mensaje: "No se pudo eliminar el médico." });
        if (!this.changes) return res.status(404).json({ mensaje: "Médico no encontrado." });
        res.json({ mensaje: "Médico eliminado correctamente." });
    });
});

module.exports = router;
