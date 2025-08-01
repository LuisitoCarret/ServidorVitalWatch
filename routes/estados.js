import express from "express";
import { db } from "../firebase.js"; // asegúrate de usar la extensión `.js` y exportar correctamente en `firebase.js`

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

    // Obtener pacientes del estado
    const pacientesSnapshot = await db.collection("pacientes")
      .where("estado", "==", nombreEstado)
      .get();

    const regiones = {};
    let totalPacientes = 0;

    for (const doc of pacientesSnapshot.docs) {
      const paciente = doc.data();
      const pacienteId = doc.id;
      const region = paciente.region || "Sin región";

      // Obtener evento más reciente del paciente
      const eventos = await db.collection("eventos_sync")
        .where("user_id", "==", pacienteId)
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();

      const evento = eventos.docs[0]?.data();
      const color = evento?.nivelAlerta?.toLowerCase(); // "rojo", "amarillo", "verde"

      if (!regiones[region]) {
        regiones[region] = {
          nombre: region,
          pacientes: 0,
          estables: 0,
          alerta: 0,
          criticos: 0
        };
      }

      regiones[region].pacientes += 1;
      totalPacientes += 1;

      if (color === "verde") regiones[region].estables += 1;
      else if (color === "amarillo") regiones[region].alerta += 1;
      else if (color === "rojo") regiones[region].criticos += 1;
    }

    return res.json({
      estado: nombreEstado,
      total_pacientes: totalPacientes,
      regiones: Object.values(regiones)
    });

  } catch (error) {
    console.error("Error en /:estadoId/detalle:", error);
    return res.status(500).json({ error: "Error al obtener regiones", detalle: error.message });
  }
});

export default router;
