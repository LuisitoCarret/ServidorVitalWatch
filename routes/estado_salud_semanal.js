// endpoint 12

// Tendencia semanal de pacientes críticos por estado

import express from 'express';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const router = express.Router();
const db = getFirestore();

// Endpoint 2: Tendencia semanal de pacientes críticos por estado (últimas 4 semanas)
router.get('/:estado/tendencia', async (req, res) => {
  try {
    const estado = req.params.estado;
    const eventosRef = db.collection('eventos_sync');

    const now = new Date();
    const semanas = [];

    for (let i = 3; i >= 0; i--) {
      const inicio = new Date(now);
      inicio.setDate(now.getDate() - 7 * i);
      const fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 7);

      const snapshot = await eventosRef
        .where('estado', '==', estado)
        .where('nivelAlerta', '==', 'rojo')
        .where('timestamp', '>=', Timestamp.fromDate(inicio))
        .where('timestamp', '<', Timestamp.fromDate(fin))
        .get();

      semanas.push({
        semana: `Sem ${4 - i}`,
        pacientes_criticos: snapshot.size
      });
    }

    res.json({ estado, tendencia_semanal: semanas });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular tendencia', detail: error.message });
  }
});

export default router;
