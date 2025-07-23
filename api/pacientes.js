import { db } from "../firebase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const snapshot = await db.collection("pacientes").get();
    const pacientes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(pacientes);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener pacientes" });
  }
}
