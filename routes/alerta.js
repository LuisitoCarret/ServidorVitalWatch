//Primer endpoint

import express from "express";
import { db, admin } from "../firebase.js";

const router = express.Router();

// Función para dar formato al tiempo
function formatoTiempo(ms) {
  const totalSegundos = Math.floor(ms / 1000);
  const h = Math.floor(totalSegundos / 3600);
  const m = Math.floor((totalSegundos % 3600) / 60);

  if (totalSegundos < 60) {
    return `${totalSegundos} seg`;
  }

  const partes = [];
  if (h > 0) partes.push(`${h} h`);
  partes.push(`${m} min`);
  return partes.join(" ");
}

// Comparación de niveles de alerta
function nivelMasCritico(actual, nuevo) {
  const niveles = { verde: 1, amarillo: 2, rojo: 3 };
  return niveles[nuevo] > niveles[actual] ? nuevo : actual;
}

router.get("/estadistica", async (req, res) => {
  try {
    const eventosRef = db.collection("eventos_sync");
    const snapshot = await eventosRef.get();

    if (snapshot.empty) {
      return res.status(404).json({ mensaje: "No hay eventos registrados." });
    }

    const eventosPorPaciente = new Map();

    // Obtener último evento por paciente
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

    let estables = 0;
    let alerta = 0;
    let criticos = 0;
    const Pacientes_Criticos = [];
    const estadosResumen = new Map();

    for (const [id, evento] of eventosPorPaciente.entries()) {
      const nivel = evento.nivelAlerta?.toLowerCase();
      const pacienteRef = db.collection("pacientes").doc(id);
      const pacienteDoc = await pacienteRef.get();
      if (!pacienteDoc.exists) continue;

      const paciente = pacienteDoc.data();
      const estadoPaciente = paciente.estado || "Desconocido";

      // Actualizar resumen de estado por región
      if (!estadosResumen.has(estadoPaciente)) {
        estadosResumen.set(estadoPaciente, nivel);
      } else {
        const nivelAnterior = estadosResumen.get(estadoPaciente);
        estadosResumen.set(estadoPaciente, nivelMasCritico(nivelAnterior, nivel));
      }

      // Acciones según el nivel de alerta
      if (nivel === "verde" || nivel === "amarillo") {
        if (paciente.inicio_riesgo) {
          await pacienteRef.update({
            inicio_riesgo: admin.firestore.FieldValue.delete()
          });
        }
        if (nivel === "verde") estables++;
        else alerta++;
      }

      if (nivel === "rojo") {
        criticos++;

        let inicio = paciente.inicio_riesgo;

        // Si no tiene tiempo de inicio, asignarlo ahora
        if (!inicio) {
          inicio = Date.now();
          await pacienteRef.update({ inicio_riesgo: inicio });
        }

        const diferenciaMs = Date.now() - inicio;
        const tiempo_en_riesgo = formatoTiempo(diferenciaMs);

        Pacientes_Criticos.push({
          id,
          nombre: paciente.nombre || paciente.usuario || "Sin nombre",
          estado: estadoPaciente,
          tiempo_en_riesgo
        });
      }
    }

    const total = estables + alerta + criticos;

    const estados = Array.from(estadosResumen.entries()).map(([nombre, estado]) => ({
      nombre,
      estado
    }));

    return res.json({
      estables,
      alerta,
      criticos,
      total,
      pacientes_criticos: Pacientes_Criticos,
      estados
    });

  } catch (error) {
    console.error("Error en /estadistica:", error);
    res.status(500).json({ mensaje: "Error del servidor", error: error.message });
  }
});

export default router;

