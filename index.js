import express from "express";
import cors from "cors";

import pacientesRoute from "./routes/pacientes.js";
import estadisticasRoute from "./routes/estadisticas.js";
import signosRoute from "./routes/signos.js";
import estadoRoute from "./routes/estados.js";
import regionRoute from "./routes/paciente_region.js";
import alertaRoute from "./routes/alerta.js";
// import tendenciaRoute from "./routes/criticos_semanal.js";
import tendenciaEstadoRoute from "./routes/tendencia_estado_riesgo.js";
 // import distribucionGeneralRoute from "./routes/distribucionSalud.js";
import estadoSaludRoute from "./routes/estado_salud.js";
import estadoSaludSemanalRoute from "./routes/estado_salud_semanal.js";
import estadoSaludRiesgoRoute from "./routes/estado_riesgo_pacientes.js"
import listaEstadosRoute from "./routes/lista_estados.js";

const app = express();
app.use(cors());

// Rutas montadas
app.use("/estados",listaEstadosRoute);
app.use("/pacientes", pacientesRoute);
app.use("/estadisticas", estadisticasRoute);
app.use("/signos", signosRoute);
app.use("/estados",estadoRoute);
app.use("/region",regionRoute);
app.use("/alerta",alertaRoute);
app.use("/resumen",tendenciaEstadoRoute);
app.use("/estadisticas",estadoSaludRoute);
app.use("/estado",estadoSaludSemanalRoute);
app.use("/estado",estadoSaludRiesgoRoute);

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
