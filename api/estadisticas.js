import { db } from "../firebase.js";

export default async function handler(req, res) {
  try {
    const doc = await db.collection("estadisticas").doc("resumen").get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }

    res.status(200).json(doc.data());
  } catch (err) {
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
}
