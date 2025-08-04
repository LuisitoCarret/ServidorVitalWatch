// enpoint 11

// Regiones con más pacientes en riesgo dentro de un estado

import express from 'express';
import { getFirestore } from 'firebase-admin/firestore';

const router = express.Router();
const db = getFirestore();

// Endpoint: Zonas de mayor riesgo por estado
router.get('/:estado/zonas-riesgo', async (req, res) => {
  try {
    const estado = req.params.estado;
    const eventosRef = db.collection('eventos_sync');

    const snapshot = await eventosRef
      .where('estado', '==', estado)
      .where('nivelAlerta', '==', 'rojo')
      .get();

    const zonasRiesgo = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      const zona = data.zona || 'Zona desconocida';

      if (!zonasRiesgo[zona]) {
        zonasRiesgo[zona] = 0;
      }
      zonasRiesgo[zona]++;
    });

    // Convertir a array y ordenar por número de pacientes en riesgo descendente
    const resultado = Object.entries(zonasRiesgo)
      .map(([zona, cantidad]) => ({ zona, pacientes_en_riesgo: cantidad }))
      .sort((a, b) => b.pacientes_en_riesgo - a.pacientes_en_riesgo);

    res.json({
      estado,
      zonas_mas_riesgo: resultado
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener zonas de riesgo',
      detail: error.message
    });
  }
});

export default router;
