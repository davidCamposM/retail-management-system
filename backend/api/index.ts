/**
 * Punto de entrada de la serverless function en Vercel.
 *
 * Vercel convierte automáticamente cada archivo de esta carpeta en una función.
 * Una app de Express ya es un handler (req, res), así que basta con exportarla:
 * Vercel la invoca por cada petición, sin mantener ningún proceso encendido.
 */
import app from "../src/app";

export default app;
