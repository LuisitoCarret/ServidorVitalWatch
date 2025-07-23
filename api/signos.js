import { db } from "../firebase.js";

export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "Falta el parámetro userId" });
  }

  try {
    const ref = db.collection("pacientes").doc(userId).collection("signos_vitales");
    const snapshot = await ref.orderBy("timestamp", "desc").get();
    const signos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(signos);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener signos vitales" });
  }
}
