import express from "express";
import { db } from "../firebase.js"; // Asegúrate que `firebase.js` exporta `db`
const router = express.Router();

// GET /regiones/:region/pacientes
router.get("/:region/pacientes", async (req, res) => {
  const regionParam = decodeURIComponent(req.params.region).toLowerCase();

  try {
    const snapshot = await db.collection('eventos_sync')
      .where('region', '==', regionParam)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ mensaje: 'No se encontraron pacientes en esta región' });
    }

    const pacientes = [];

    snapshot.forEach(doc => {
      const data = doc.data();

      // Normalizar nivel de alerta
      let nivel = 'estable';
      if (data.nivelAlerta?.toLowerCase() === 'rojo') nivel = 'crítico';
      else if (data.nivelAlerta?.toLowerCase() === 'amarillo') nivel = 'alerta';

      pacientes.push({
        id: data.id || doc.id,
        nombre: data.nombre || 'Desconocido',
        nivelAlerta: nivel,
        ritmoCardiaco: data.ritmoCardiaco || 0,
        temperatura: data.temperatura || 0,
        oxigenacion: data.oxigenacion || 0,
        ubicacion: `${(data.municipio || '').trim()}, ${(data.colonia || '').trim()}`
      });
    });

    res.json({
      region: regionParam,
      pacientes
    });

  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({ error: 'Error interno', detalle: error.message });
  }
});

export default router;
