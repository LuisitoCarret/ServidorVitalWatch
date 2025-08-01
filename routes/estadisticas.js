import express from "express";
import { db } from "../firebase.js"; // Asegúrate que el archivo se llame `firebase.js` y usa la extensión `.js`

const router = express.Router();

// Calcular tiempo desde timestamp
function calcularMinutosDesde(timestamp) {
  const ms = timestamp.toString().length === 13 ? timestamp : timestamp * 1000;
  const ahora = new Date();
  const evento = new Date(ms);
  const diferenciaMs = ahora - evento;
  return `${Math.floor(diferenciaMs / 60000)} min`;
}

router.get("/resumen", async (req, res) => {
  try {
    // Obtener resumen numérico
    const resumenDoc = await db.collection("estadisticas").doc("resumen").get();
    const resumenData = resumenDoc.exists ? resumenDoc.data() : {};

    // Buscar eventos de alerta ("rojo")
    const eventosSnapshot = await db.collection("eventos_sync")
      .where("nivelAlerta", "==", "rojo")
      .orderBy("timestamp", "desc")
      .get();

    const pacientesUnicos = {};
    eventosSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const id = data.id_paciente?.toString();
      if (id && !pacientesUnicos[id]) {
        pacientesUnicos[id] = data.timestamp;
      }
    });

    const enAlerta = [];
    for (const id of Object.keys(pacientesUnicos)) {
      const pacienteDoc = await db.collection("pacientes").doc(id).get();
      if (pacienteDoc.exists) {
        const paciente = pacienteDoc.data();
        enAlerta.push({
          id,
          usuario: paciente.usuario || "Desconocido",
          tiempo_en_riesgo: calcularMinutosDesde(pacientesUnicos[id])
        });
      }
    }

    return res.json({
      ...resumenData,
      en_alerta: enAlerta
    });

  } catch (error) {
    console.error("Error en /estadisticas/resumen:", error);
    return res.status(500).json({ error: "Error al obtener resumen", detalle: error.message });
  }
});

export default router;
