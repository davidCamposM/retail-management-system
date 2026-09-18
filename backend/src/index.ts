import app from "./app";

/**
 * Punto de entrada para desarrollo local: levanta un servidor HTTP que queda
 * escuchando. En producción (Vercel) este archivo no se usa — ver api/index.ts.
 */
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`)
})
