//segundo enpoint

import express from "express";

const router = express.Router();

// Lista fija de estados
const estados = [
  { id: "AGS", nombre: "Aguascalientes" },
  { id: "BC", nombre: "Baja California" },
  { id: "BCS", nombre: "Baja California Sur" },
  { id: "CAMP", nombre: "Campeche" },
  { id: "CDMX", nombre: "Ciudad de México" },
  { id: "CHIS", nombre: "Chiapas" },
  { id: "CHIH", nombre: "Chihuahua" },
  { id: "COAH", nombre: "Coahuila" },
  { id: "COL", nombre: "Colima" },
  { id: "DGO", nombre: "Durango" },
  { id: "GTO", nombre: "Guanajuato" },
  { id: "GRO", nombre: "Guerrero" },
  { id: "HGO", nombre: "Hidalgo" },
  { id: "JAL", nombre: "Jalisco" },
  { id: "MEX", nombre: "Estado de México" },
  { id: "MICH", nombre: "Michoacán" },
  { id: "MOR", nombre: "Morelos" },
  { id: "NAY", nombre: "Nayarit" },
  { id: "NL", nombre: "Nuevo León" },
  { id: "OAX", nombre: "Oaxaca" },
  { id: "PUE", nombre: "Puebla" },
  { id: "QRO", nombre: "Querétaro" },
  { id: "QROO", nombre: "Quintana Roo" },
  { id: "SLP", nombre: "San Luis Potosí" },
  { id: "SIN", nombre: "Sinaloa" },
  { id: "SON", nombre: "Sonora" },
  { id: "TAB", nombre: "Tabasco" },
  { id: "TAMPS", nombre: "Tamaulipas" },
  { id: "TLAX", nombre: "Tlaxcala" },
  { id: "VER", nombre: "Veracruz" },
  { id: "YUC", nombre: "Yucatán" },
  { id: "ZAC", nombre: "Zacatecas" }
];

// GET /estados/lista
router.get("/lista", (req, res) => {
  res.json(estados);
});

export default router;
