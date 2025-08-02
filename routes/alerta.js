import express from "express";
import { db } from "../firebase.js"; // Asegúrate que `firebase.js` exporta `db` correctamente

const router = express.Router();

router.get("/estadistica", async (req, res) => {
  try {
    const eventosRef = db.collection("eventos_sync");
    const pacientesRef = db.collection("pacientes");

    const snapshot = await eventosRef.get();
    if (snapshot.empty) {
      return res.status(404).json({ mensaje: "No hay eventos registrados." });
    }

    const eventosPorPaciente = new Map();

    // Obtener el evento más reciente por paciente
    snapshot.forEach((doc) => {
      const data = doc.data();
      const idPaciente = String(data.id_paciente);
      const timestamp = data.timestamp;

      if (!eventosPorPaciente.has(idPaciente)) {
        eventosPorPaciente.set(idPaciente, data);
      } else {
        const eventoActual = eventosPorPaciente.get(idPaciente);
        if (timestamp > eventoActual.timestamp) {
          eventosPorPaciente.set(idPaciente, data);
        }
      }
    });

    let estables = 0;
    let alerta = 0;
    let criticos = 0;
    const pacientesCriticos = [];

    const ahora = new Date();

    for (const [idPaciente, evento] of eventosPorPaciente.entries()) {
      const nivel = evento.nivelAlerta?.toLowerCase();

      if (nivel === "verde") estables++;
      else if (nivel === "amarillo") alerta++;
      else if (nivel === "rojo") {
        criticos++;

        const pacienteSnap = await pacientesRef.doc(idPaciente).get();
        const paciente = pacienteSnap.exists ? pacienteSnap.data() : {};

        const timestampEvento = new Date(evento.timestamp);
        const minutosEnRiesgo = Math.floor((ahora - timestampEvento) / 60000);

        pacientesCriticos.push({
          id: idPaciente,
          nombre: paciente.nombre || "Desconocido",
          estado: paciente.estado || "Sin estado",
          tiempo_en_riesgo: `${minutosEnRiesgo} min`,
        });
      }
    }

    const total = estables + alerta + criticos;

    return res.json({
      estables,
      alerta,
      criticos,
      total,
      pacientes_criticos: pacientesCriticos,
    });

  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ mensaje: "Error del servidor", error: error.message });
  }
});

export default router;
