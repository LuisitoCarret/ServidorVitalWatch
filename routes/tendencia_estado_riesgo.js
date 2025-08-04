import express from "express";
import { db } from "../firebase.js";

const router = express.Router();

router.get("/general", async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 30;
    const hoy = new Date();
    const fechaLimite = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
    const fechaInicio5Semanas = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);

    // --- 1. Riesgo por estado (nivelAlerta == rojo) ---
    const eventosRojosSnap = await db.collection("eventos_sync")
      .where("nivelAlerta", "==", "rojo")
      .where("timestamp", ">=", fechaLimite)
      .get();

    const pacientesPorEstado = {};
    const idsEventosRojos = new Set(); // Para usar también en sección 3

    for (const doc of eventosRojosSnap.docs) {
      const evento = doc.data();
      const idPaciente = String(evento.id_paciente);
      idsEventosRojos.add(idPaciente);

      const pacienteDoc = await db.collection("pacientes").doc(idPaciente).get();
      if (!pacienteDoc.exists) continue;

      const paciente = pacienteDoc.data();
      const estado = paciente.estado || "Desconocido";

      if (!pacientesPorEstado[estado]) pacientesPorEstado[estado] = new Set();
      pacientesPorEstado[estado].add(idPaciente);
    }

    const resumen_estados = Object.entries(pacientesPorEstado)
      .map(([estado, ids]) => ({
        estado,
        pacientes_en_riesgo: ids.size
      }))
      .sort((a, b) => b.pacientes_en_riesgo - a.pacientes_en_riesgo);

    // --- 2. Distribución de salud por último evento por paciente ---
    const eventosSnap = await db.collection("eventos_sync")
      .where("timestamp", ">=", fechaLimite)
      .get();

    const ultimoEventoPorPaciente = new Map();

    for (const doc of eventosSnap.docs) {
      const data = doc.data();
      const idPaciente = String(data.id_paciente);
      const timestamp = data.timestamp;

      if (!idPaciente || !timestamp) continue;

      const actual = ultimoEventoPorPaciente.get(idPaciente);
      if (!actual || new Date(timestamp) > new Date(actual.timestamp)) {
        ultimoEventoPorPaciente.set(idPaciente, data);
      }
    }

    let criticos = 0, alerta = 0, estables = 0;

    for (const evento of ultimoEventoPorPaciente.values()) {
      const nivel = (evento.nivelAlerta || evento.NivelAlerta || "").toLowerCase();
      if (nivel === "rojo") criticos++;
      else if (nivel === "amarillo") alerta++;
      else if (nivel === "verde") estables++;
    }

    const distribucion_salud = {
      total: criticos + alerta + estables,
      criticos,
      alerta,
      estables
    };

    // --- 3. Tendencia semanal de pacientes críticos únicos ---
    const eventosCriticosSnap = await db.collection("eventos_sync")
      .where("nivelAlerta", "==", "rojo")
      .where("timestamp", ">=", fechaInicio5Semanas)
      .get();

    const semanas = [new Set(), new Set(), new Set(), new Set(), new Set()];

    for (const doc of eventosCriticosSnap.docs) {
      const evento = doc.data();
      const timestamp = evento.timestamp;
      const idPaciente = String(evento.id_paciente);

      if (!(timestamp instanceof Date) && !(timestamp.toDate)) continue;
      const fechaEvento = timestamp.toDate ? timestamp.toDate() : timestamp;

      const diasDesdeInicio = Math.floor((fechaEvento - fechaInicio5Semanas) / (1000 * 60 * 60 * 24));
      const semanaIndex = Math.min(Math.floor(diasDesdeInicio / 7), 4);
      semanas[semanaIndex].add(idPaciente);
    }

    const tendencia_semanal = semanas.map((set, i) => ({
      semana: `Semana ${i + 1}`,
      pacientes_criticos: set.size
    }));

    // --- Respuesta final ---
    res.json({
      resumen_estados,
      distribucion_salud,
      tendencia_semanal
    });

  } catch (error) {
    console.error("❌ Error en /resumen/general:", error);
    res.status(500).json({ 
      error: "Error al obtener el resumen general", 
      detalle: error.message 
    });
  }
});

export default router;
