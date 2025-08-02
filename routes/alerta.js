import express from "express";
import { db } from "../firebase.js";

const router = express.Router();

// Calcular minutos desde timestamp
function calcularMinutosDesde(timestamp) {
  const ms = timestamp.toString().length === 13 ? timestamp : timestamp * 1000;
  const ahora = new Date();
  const evento = new Date(ms);
  const diferenciaMs = ahora - evento;
  return `${Math.floor(diferenciaMs / 60000)} min`;
}

router.get("/estadistica", async (req, res) => {
  try {
    const eventosRef = db.collection("eventos_sync");
    const snapshot = await eventosRef.get();

    if (snapshot.empty) {
      return res.status(404).json({ mensaje: "No hay eventos registrados." });
    }

    const eventosPorPaciente = new Map();

    // Último evento por paciente
    snapshot.forEach(doc => {
      const data = doc.data();
      const idPaciente = data.id_paciente;
      const timestamp = data.timestamp;

      if (!eventosPorPaciente.has(idPaciente)) {
        eventosPorPaciente.set(idPaciente, data);
      } else {
        const actual = eventosPorPaciente.get(idPaciente);
        if (timestamp > actual.timestamp) {
          eventosPorPaciente.set(idPaciente, data);
        }
      }
    });

    // Contadores y pacientes críticos
    let estables = 0;
    let alerta = 0;
    let criticos = 0;
    const Pacientes_Criticos = [];

    for (const [id, evento] of eventosPorPaciente.entries()) {
      const nivel = evento.nivelAlerta?.toLowerCase();

      if (nivel === "verde") {
        estables++;
      } else if (nivel === "amarillo") {
        alerta++;
      } else if (nivel === "rojo") {
        criticos++;

        // Buscar paciente
        const pacienteDoc = await db.collection("pacientes").doc(id).get();
        if (pacienteDoc.exists) {
          const paciente = pacienteDoc.data();
          Pacientes_Criticos.push({
            id,
            nombre: paciente.nombre || paciente.usuario || "Sin nombre",
            estado: paciente.estado || "Desconocido",
            tiempo_en_riesgo: calcularMinutosDesde(evento.timestamp)
          });
        }
      }
    }

    const total = estables + alerta + criticos;

    return res.json({
      estables,
      alerta,
      criticos,
      total,
      Pacientes_Criticos
    });

  } catch (error) {
    console.error("Error en /estadisticas/resumen:", error);
    res.status(500).json({ mensaje: "Error del servidor", error: error.message });
  }
});

export default router;
