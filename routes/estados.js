//Tercero endpoint

import express from "express";
import { db } from "../firebase.js";

const router = express.Router();

router.get("/:estadoId/detalle", async (req, res) => {
  try {
    const estadoId = req.params.estadoId.toUpperCase();

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

    const nombreEstado = estadosMap[estadoId];
    if (!nombreEstado) {
      return res.status(400).json({ error: "ID de estado no válido" });
    }

    const pacientesSnapshot = await db.collection("pacientes")
      .where("estado", "==", nombreEstado)
      .get();

    const totalPacientesEstado = pacientesSnapshot.size;

    const regiones = {};

    for (const doc of pacientesSnapshot.docs) {
      const paciente = doc.data();
      const pacienteId = doc.id;
      const region = paciente.region || "Sin región";

      const eventos = await db.collection("eventos_sync")
        .where("id_paciente", "==", pacienteId)
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();

      const evento = eventos.docs[0]?.data();
      const color = String(evento?.nivelAlerta || "").toLowerCase();

      if (!regiones[region]) {
        regiones[region] = {
          nombre: region,
          totalPacientes: 0,
          estables: 0,
          alerta: 0,
          criticos: 0
        };
      }

      regiones[region].totalPacientes += 1;

      if (color === "verde") regiones[region].estables += 1;
      else if (color === "amarillo") regiones[region].alerta += 1;
      else if (color === "rojo") regiones[region].criticos += 1;
    }

    const regionesOrdenadas = Object.values(regiones).sort((a, b) => b.criticos - a.criticos);

    return res.json({
      estado: nombreEstado,
      totalPacientesEstado,
      regiones: regionesOrdenadas
    });

  } catch (error) {
    console.error("Error en /:estadoId/detalle:", error);
    return res.status(500).json({ error: "Error al obtener regiones", detalle: error.message });
  }
});

export default router;

