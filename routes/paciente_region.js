//endpoint 4

import express from "express";
import { db } from "../firebase.js";

const router = express.Router();

// Endpoint: pacientes por región y estado
router.get("/pacientes", async (req, res) => {
  try {
    const estadoParam = req.query.estado?.toLowerCase();
    const regionParam = req.query.region?.toLowerCase();

    if (!estadoParam || !regionParam) {
      return res.status(400).json({ error: "Faltan parámetros: estado y región" });
    }

    const snapshot = await db.collection("pacientes").get();
    const pacientes = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;
      const estadoDb = data.estado?.toLowerCase();
      const regionDb = data.region?.toLowerCase();

      if (estadoDb === estadoParam && regionDb === regionParam) {
        pacientes.push({
          id,
          nombre: data.nombre || "Desconocido",
          estado: data.estado || "Sin estado",
          ritmo_cardiaco: data.ritmo_cardiaco || "No disponible",
          //oxigenacion: data.oxigenacion || "No disponible",
          ubicacion: `${(data.ciudad || "").trim()}, ${(data.colonia || "").trim()}`
        });
      }
    });

    return res.json({ pacientes });

  } catch (error) {
    console.error("Error en /pacientes-por-region:", error);
    return res.status(500).json({ error: "Error al obtener pacientes", detalle: error.message });
  }
});

export default router;
