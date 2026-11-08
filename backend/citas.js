const express = require("express");
const db = require("./database");

const router = express.Router();

function validarFecha(fecha) {
    return typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha);
}

function validarHora(hora) {
    return typeof hora === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
}

function validarCita(body) {
    return Number.isInteger(Number(body.paciente_id)) &&
        Number(body.paciente_id) > 0 &&
        validarFecha(body.fecha) &&
        validarHora(body.hora) &&
        typeof body.motivo === "string" &&
        body.motivo.trim().length > 0 &&
        (!body.estado || ["Programada", "Cancelada", "Completada"].includes(body.estado));
}

function verificarPaciente(id, callback) {
    db.get("SELECT id FROM pacientes WHERE id = ?", [id], callback);
}

function verificarDisponibilidad(fecha, hora, id, callback) {
    const parametros = [fecha, hora];
    let consulta = "SELECT id FROM citas WHERE fecha = ? AND hora = ? AND estado != 'Cancelada'";
    if (id) {
        consulta += " AND id != ?";
        parametros.push(id);
    }
    db.get(consulta, parametros, (error, cita) => callback(error, Boolean(cita)));
}

router.get("/", (req, res) => {
    const buscar = typeof req.query.buscar === "string" ? req.query.buscar.trim() : "";
    const termino = `%${buscar}%`;
    db.all(
        `SELECT citas.id, citas.paciente_id, pacientes.nombre AS paciente,
                citas.fecha, citas.hora, citas.motivo, citas.estado
         FROM citas INNER JOIN pacientes ON pacientes.id = citas.paciente_id
         WHERE pacientes.nombre LIKE ? OR citas.fecha LIKE ?
         ORDER BY citas.fecha, citas.hora`,
        [termino, termino],
        (error, citas) => {
            if (error) return res.status(500).json({ mensaje: "No se pudieron consultar las citas." });
            res.json(citas);
        }
    );
});

router.post("/", (req, res) => {
    if (!validarCita(req.body)) return res.status(400).json({ mensaje: "Verifica los datos de la cita." });
    const { paciente_id, fecha, hora, motivo } = req.body;
    verificarPaciente(paciente_id, (error, paciente) => {
        if (error) return res.status(500).json({ mensaje: "No se pudo validar el paciente." });
        if (!paciente) return res.status(404).json({ mensaje: "El paciente no existe." });
        verificarDisponibilidad(fecha, hora, null, (errorHorario, ocupado) => {
            if (errorHorario) return res.status(500).json({ mensaje: "No se pudo validar el horario." });
            if (ocupado) return res.status(409).json({ mensaje: "Ya existe una cita en ese horario." });
            db.run(
                "INSERT INTO citas (paciente_id, fecha, hora, motivo) VALUES (?, ?, ?, ?)",
                [paciente_id, fecha, hora, motivo.trim()],
                function (errorInsercion) {
                    if (errorInsercion) return res.status(500).json({ mensaje: "No se pudo registrar la cita." });
                    res.status(201).json({ id: this.lastID, mensaje: "Cita registrada correctamente." });
                }
            );
        });
    });
});

router.put("/:id", (req, res) => {
    if (!validarCita(req.body)) return res.status(400).json({ mensaje: "Verifica los datos de la cita." });
    const { paciente_id, fecha, hora, motivo, estado = "Programada" } = req.body;
    verificarPaciente(paciente_id, (error, paciente) => {
        if (error) return res.status(500).json({ mensaje: "No se pudo validar el paciente." });
        if (!paciente) return res.status(404).json({ mensaje: "El paciente no existe." });
        verificarDisponibilidad(fecha, hora, req.params.id, (errorHorario, ocupado) => {
            if (errorHorario) return res.status(500).json({ mensaje: "No se pudo validar el horario." });
            if (ocupado && estado !== "Cancelada") return res.status(409).json({ mensaje: "Ya existe una cita en ese horario." });
            db.run(
                "UPDATE citas SET paciente_id = ?, fecha = ?, hora = ?, motivo = ?, estado = ? WHERE id = ?",
                [paciente_id, fecha, hora, motivo.trim(), estado, req.params.id],
                function (errorActualizacion) {
                    if (errorActualizacion) return res.status(500).json({ mensaje: "No se pudo actualizar la cita." });
                    if (!this.changes) return res.status(404).json({ mensaje: "Cita no encontrada." });
                    res.json({ mensaje: "Cita actualizada correctamente." });
                }
            );
        });
    });
});

router.patch("/:id/cancelar", (req, res) => {
    db.run("UPDATE citas SET estado = 'Cancelada' WHERE id = ?", [req.params.id], function (error) {
        if (error) return res.status(500).json({ mensaje: "No se pudo cancelar la cita." });
        if (!this.changes) return res.status(404).json({ mensaje: "Cita no encontrada." });
        res.json({ mensaje: "Cita cancelada correctamente." });
    });
});

module.exports = router;
