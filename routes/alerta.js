import express from "express";
import { db } from "../firebase.js"; // Asegúrate de tener exportado `db` correctamente

const router = express.Router();

// GET /api/estadisticas-nivel-alerta
router.get("/estadistica", async (req, res) => {
  try {
    const eventosRef = db.collection("eventos_sync");
    const snapshot = await eventosRef.get();

    if (snapshot.empty) {
      return res.status(404).json({ mensaje: "No hay eventos registrados." });
    }

    const eventosPorPaciente = new Map();

    // Obtener el evento más reciente por paciente
    snapshot.forEach(doc => {
      const data = doc.data();
      const idPaciente = data.id_paciente;
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

    // Inicializar contadores
    let estables = 0;
    let alerta = 0;
    let criticos = 0;

    // Clasificación según nivelAlerta
    eventosPorPaciente.forEach(evento => {
      const nivel = evento.nivelAlerta?.toLowerCase();
      if (nivel === "verde") {
        estables++;
      } else if (nivel === "amarillo") {
        alerta++;
      } else if (nivel === "rojo") {
        criticos++;
      }
    });

    const total = estables + alerta + criticos;

    return res.json({
      estables,
      alerta,
      criticos,
      total
    });

  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ mensaje: "Error del servidor", error: error.message });
  }
});

export default router;
