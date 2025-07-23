import express from "express";
import cors from "cors";

import pacientesRoute from "./routes/pacientes.js";
import estadisticasRoute from "./routes/estadisticas.js";
import signosRoute from "./routes/signos.js";

const app = express();
app.use(cors());

// Rutas montadas
app.use("/pacientes", pacientesRoute);
app.use("/estadisticas", estadisticasRoute);
app.use("/signos", signosRoute);

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
