import express from "express";
import { db } from "../firebase.js";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const signosRef = db.collection("pacientes").doc(userId).collection("signos_vitales");
    const snapshot = await signosRef.orderBy("timestamp", "desc").get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No hay registros de signos vitales para este usuario" });
    }

    const signos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(signos);
  } catch (err) {
    console.error("Error al obtener signos vitales:", err);
    res.status(500).json({ error: "Error al obtener signos vitales" });
  }
});

export default router;
