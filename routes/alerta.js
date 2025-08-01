import express from "express";
import { db } from "../firebase.js"; // Asegúrate de que `firebase.js` exporta `db` correctamente

const router = express.Router();

router.get("/resumen", async (req, res) => {
  try {
    // 1. Obtener todos los pacientes
    const pacientesSnapshot = await db.collection("pacientes").get();

    // 2. Inicializar contadores
    let estables = 0;
    let alerta = 0;
    let criticos = 0;

    // 3. Recorrer cada paciente y obtener su último evento
    for (const doc of pacientesSnapshot.docs) {
      const pacienteId = doc.id;

      const eventos = await db.collection("eventos_sync")
        .where("id_paciente", "==", pacienteId) // 🔁 Ya no convertir a Number
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();

      if (!eventos.empty) {
        const evento = eventos.docs[0].data();
        const nivel = evento.nivelAlerta?.toLowerCase();

        if (nivel === "verde") estables++;
        else if (nivel === "amarillo") alerta++;
        else if (nivel === "rojo") criticos++;
      }
    }

    const total = estables + alerta + criticos;

    return res.json({
      estables,
      alerta,
      criticos,
      total
    });
  } catch (error) {
    console.error("Error al obtener resumen:", error);
    return res.status(500).json({ error: "Error interno", detalle: error.message });
  }
});

export default router;
