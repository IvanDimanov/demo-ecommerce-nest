import path from 'node:path';
import { cwd } from 'node:process';
import { styleText } from 'node:util';

import dotenv from 'dotenv';
import { z } from 'zod';

import { envVarsValidationSchema } from './envVarsValidationSchema';

const dotenvFilePaths = [
  path.resolve(cwd(), '.env.local'),
  path.resolve(cwd(), '.env'),
];

dotenv.config({
  quiet: true,
  override: true,
  path: dotenvFilePaths,
});

const parse = envVarsValidationSchema.safeParse(process.env);
if (!parse.success) {
  const prettyError = z.prettifyError(parse.error);
  console.error('❌ Invalid environment variables:');
  console.error('');

  console.error('Please check the content of these files:');
  dotenvFilePaths.forEach((filePath) =>
    console.error('-', styleText('bold', filePath)),
  );
  console.error('');

  console.error(prettyError);
  process.exit(1);
}

export const envVars = Object.freeze(parse.data);
