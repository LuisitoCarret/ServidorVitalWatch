import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import { readFileSync } from "fs";

// Lee el archivo de claves descargado desde Firebase
const serviceAccount = JSON.parse(
  readFileSync("./serviceAccountKey.json", "utf8")
);

// Inicializa Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Referencia a Firestore
const db = admin.firestore();

// Crear app Express
const app = express();
app.use(cors());

// Endpoint GET /pacientes
app.get("/pacientes", async (req, res) => {
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


// Endpoint GET /estadisticas → devuelve los datos generales
app.get("/estadisticas", async (req, res) => {
  try {
    const doc = await db.collection("estadisticas").doc("resumen").get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }

    res.json(doc.data());
  } catch (err) {
    console.error("Error al obtener estadísticas:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Endpoint GET /signos/:userId → devuelve los signos_vitales de un paciente
app.get("/signos/:userId", async (req, res) => {
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


// Inicia el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
