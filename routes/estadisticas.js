

import express from "express";
import { db } from "../firebase.js"; // Asegúrate de que el archivo se llame `firebase.js` y uses la extensión

const router = express.Router();

// Calcular minutos desde un timestamp numérico
function calcularMinutosDesde(timestamp) {
  const ms = timestamp.toString().length === 13 ? timestamp : timestamp * 1000;
  const ahora = new Date();
  const evento = new Date(ms);
  const diferenciaMs = ahora - evento;
  return `${Math.floor(diferenciaMs / 60000)} min`;
}

router.get("/resumen", async (req, res) => {
  try {
    // Obtener estadísticas generales desde el doc "resumen"
    const resumenDoc = await db.collection("estadisticas").doc("resumen").get();
    const resumenData = resumenDoc.exists ? resumenDoc.data() : {};

    // Buscar eventos con nivelAlerta "rojo" (críticos)
    const eventosSnapshot = await db.collection("eventos_sync")
      .where("nivelAlerta", "==", "rojo")
      .orderBy("timestamp", "desc")
      .get();

    // Agrupar por paciente, solo conservar el más reciente
    const pacientesUnicos = {};
    eventosSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const id = data.id_paciente?.toString();
      if (id && !pacientesUnicos[id]) {
        pacientesUnicos[id] = data.timestamp;
      }
    });

    // Obtener datos de pacientes críticos
    const enCritico = [];

    for (const id of Object.keys(pacientesUnicos)) {
      const pacienteDoc = await db.collection("pacientes").doc(id).get();
      if (pacienteDoc.exists) {
        const paciente = pacienteDoc.data();
        enCritico.push({
          id,
          usuario: paciente.usuario || "Desconocido",
          nombre: paciente.nombre || "Sin nombre",
          estado: paciente.estado || "Sin estado",
          tiempo_en_riesgo: calcularMinutosDesde(pacientesUnicos[id])
        });
      }
    }

    // Enviar respuesta completa
    return res.json({
      ...resumenData,
      en_critico: enCritico
    });

  } catch (error) {
    console.error("Error en /estadisticas/resumen:", error);
    return res.status(500).json({ error: "Error al obtener resumen", detalle: error.message });
  }
});

export default router;
