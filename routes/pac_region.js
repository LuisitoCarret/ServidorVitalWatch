import express from "express";
import { db } from "../firebase.js"; // Asegúrate que `firebase.js` exporta correctamente `db`

const router = express.Router();

router.get("/pacientes", async (req, res) => {
  try {
    const { estado, region } = req.query;

    if (!estado || !region) {
      return res.status(400).json({ mensaje: "Faltan parámetros: estado y región son requeridos." });
    }

    const pacientesRef = db.collection("pacientes");
    const eventosRef = db.collection("eventos_sync");

    const pacientesSnapshot = await pacientesRef
      .where("estado", "==", estado)
      .where("region", "==", region)
      .get();

    if (pacientesSnapshot.empty) {
      return res.status(404).json({ mensaje: "No se encontraron pacientes en esa región." });
    }

    const pacientesList = [];

    for (const doc of pacientesSnapshot.docs) {
      const pacienteId = doc.id;
      const paciente = doc.data();

      const eventosQuery = await eventosRef
        .where("id_paciente", "==", pacienteId)
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();

      if (!eventosQuery.empty) {
        const evento = eventosQuery.docs[0].data();

        pacientesList.push({
          id: pacienteId,
          nombre: paciente.nombre || "Desconocido",
          estado: paciente.estado || "Sin estado",
          ritmo_cardiaco: evento.ritmo_cardiaco || null,
          oxigenacion: evento.oxigenacion || null,
          ubicacion: `${paciente.estado}, ${paciente.region}`,
        });
      }
    }

    res.json({ pacientes: pacientesList });

  } catch (error) {
    console.error("Error al obtener pacientes por región:", error);
    res.status(500).json({ mensaje: "Error del servidor", error: error.message });
  }
});

export default router;
