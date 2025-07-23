import express from "express";
import { db } from "../firebase.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("pacientes").get();
    const pacientes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(pacientes);
  } catch (error) {
    console.error("Error al obtener pacientes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
