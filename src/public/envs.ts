import 'dotenv/config';
import { get } from 'env-var';

export const envs = {
  PORT: get('PORT').required().asPortNumber(),
  // Base de datos (Prisma la lee directamente del .env, pero podemos exponerla si hace falta)
  // Configuración similar a ALLOWED_HOSTS de Django (CORS)
  CORS_ORIGIN: get('CORS_ORIGIN').default('http://localhost:5173').asString(),
  // Entorno
  NODE_ENV: get('NODE_ENV').default('development').asString(),
};