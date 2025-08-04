import express from "express";
import { db } from "../firebase.js";
import { Timestamp } from "firebase-admin/firestore";

const router = express.Router();

router.get("/:estado/resumen", async (req, res) => {
  try {
    const estadosMap = {
      AGS: "Aguascalientes", BC: "Baja California", BCS: "Baja California Sur", CAMP: "Campeche",
      CDMX: "Ciudad de México", CHIS: "Chiapas", CHIH: "Chihuahua", COAH: "Coahuila",
      COL: "Colima", DGO: "Durango", GTO: "Guanajuato", GRO: "Guerrero",
      HGO: "Hidalgo", JAL: "Jalisco", MEX: "Estado de México", MICH: "Michoacán",
      MOR: "Morelos", NAY: "Nayarit", NL: "Nuevo León", OAX: "Oaxaca",
      PUE: "Puebla", QRO: "Querétaro", QROO: "Quintana Roo", SLP: "San Luis Potosí",
      SIN: "Sinaloa", SON: "Sonora", TAB: "Tabasco", TAMPS: "Tamaulipas",
      TLAX: "Tlaxcala", VER: "Veracruz", YUC: "Yucatán", ZAC: "Zacatecas"
    };

    const estadoId = req.params.estado.toUpperCase();
    const nombreEstado = estadosMap[estadoId] || decodeURIComponent(req.params.estado);
    const dias = parseInt(req.query.dias) || 30;

    const hoy = new Date();
    const fechaLimite = new Date(hoy.getTime() - dias * 24 * 60 * 60 * 1000);
    const fechaInicioTendencia = new Date(hoy.getTime() - 28 * 24 * 60 * 60 * 1000);

    // --- Parte 1: Distribución ---
    const pacientesSnapshot = await db.collection("pacientes")
      .where("estado", "==", nombreEstado)
      .get();

    const regiones = {};
    let criticos = 0, alerta = 0, estables = 0;

    for (const doc of pacientesSnapshot.docs) {
      const paciente = doc.data();
      const pacienteId = doc.id;
      const region = paciente.region || "Sin región";

      const eventos = await db.collection("eventos_sync")
        .where("id_paciente", "==", Number(pacienteId))
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();

      if (eventos.empty) continue;

      const evento = eventos.docs[0].data();
      const ts = evento.timestamp?.toDate ? evento.timestamp.toDate() : new Date(evento.timestamp);
      if (ts < fechaLimite) continue;

      const nivel = (evento.nivelAlerta || evento.NivelAlerta || "").toLowerCase();

      if (!regiones[region]) {
        regiones[region] = new Set();
      }

      if (nivel === "rojo") {
        regiones[region].add(pacienteId);
        criticos++;
      } else if (nivel === "amarillo") {
        alerta++;
      } else if (nivel === "verde") {
        estables++;
      }
    }

    const regionesRiesgo = Object.entries(regiones)
      .map(([region, set]) => ({
        region,
        pacientes_en_riesgo: set.size
      }))
      .sort((a, b) => b.pacientes_en_riesgo - a.pacientes_en_riesgo);

    const distribucionSalud = {
      criticos,
      alerta,
      estables,
      total: criticos + alerta + estables
    };

    // --- Parte 2: Tendencia semanal de alertas críticas ---
    const eventosSnap = await db.collection("eventos_sync")
      .where("timestamp", ">=", Timestamp.fromDate(fechaInicioTendencia))
      .where("nivelAlerta", "==", "rojo")
      .get();

    const semanas = [
      { nombre: "Semana 1", inicio: 0, fin: 6, total: 0 },
      { nombre: "Semana 2", inicio: 7, fin: 13, total: 0 },
      { nombre: "Semana 3", inicio: 14, fin: 20, total: 0 },
      { nombre: "Semana 4", inicio: 21, fin: 27, total: 0 },
    ];

    for (const doc of eventosSnap.docs) {
      const evento = doc.data();
      const ts = evento.timestamp.toDate?.() ?? new Date(evento.timestamp);
      const pacienteId = evento.id_paciente;

      const pacienteDoc = await db.collection("pacientes").doc(String(pacienteId)).get();
      const paciente = pacienteDoc.exists ? pacienteDoc.data() : null;

      if (paciente && paciente.estado?.toLowerCase() === nombreEstado.toLowerCase()) {
        const diffDias = Math.floor((hoy - ts) / (1000 * 60 * 60 * 24));
        const semanaIndex = Math.floor(diffDias / 7);
        if (semanaIndex >= 0 && semanaIndex < semanas.length) {
          semanas[semanaIndex].total++;
        }
      }
    }

    const tendenciaSemanal = semanas.map((s) => ({
      semana: s.nombre,
      alertas_criticas: s.total,
    }));

    // --- Respuesta unificada ---
    return res.json({
      estado: nombreEstado,
      dias,
      regionesRiesgo,
      distribucionSalud,
      tendenciaSemanal
    });

  } catch (error) {
    console.error("❌ Error en /:estado/resumen:", error);
    res.status(500).json({
      error: "Error al obtener resumen por estado",
      detalle: error.message
    });
  }
});

export default router;
