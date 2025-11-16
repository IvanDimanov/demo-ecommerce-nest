import { z } from 'zod';

export const parsePort = z.preprocess((value) => {
  if (typeof value === 'string') {
    return Number.parseInt(value);
  }
  return value;
}, z.int().min(10).max(999999).default(3306));

export const envVarsValidationSchema = z.object({
  PORT: parsePort,
  IS_SWAGGER_ENABLED: z.stringbool().default(false),
  IS_CORS_ENABLED: z.stringbool().default(false),

  MYSQL_ROOT_PASSWORD: z.string().min(16),
  MYSQL_DATABASE: z.string().min(4),
  MYSQL_USER: z.string().min(4),
  MYSQL_PASSWORD: z.string().min(16),
  MYSQL_HOST: z.string().min(4),
  MYSQL_TCP_PORT: parsePort,

  ELASTIC_USERNAME: z.string().min(4),
  ELASTIC_PASSWORD: z.string().min(16),
  ELASTIC_HOST: z.string().min(4),
  ELASTIC_HTTP_PORT: parsePort,
  ELASTIC_TRANSPORT_PORT: parsePort,
});
