import { z } from 'zod';
import { envVarsValidationSchema } from '../utils/envVarsValidationSchema';

export default () => {
  const parse = envVarsValidationSchema.safeParse(process.env);
  if (!parse.success) {
    const prettyError = z.prettifyError(parse.error);
    throw new Error(`❌ Invalid environment variables: ${prettyError}`);
  }

  return Object.freeze(parse.data);
};
