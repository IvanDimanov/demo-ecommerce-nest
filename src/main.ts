import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

import packageJson from '../package.json';

import { AppModule } from './app.module';
import { envVars } from './common/utils/getEnvVars';

const logger = new Logger('Bootstrap');
const PORT = envVars.PORT;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (envVars.IS_SWAGGER_ENABLED) {
    const config = new DocumentBuilder()
      .setTitle('Demo eCommerce API')
      .setDescription(packageJson.description)
      .setVersion(packageJson.version)
      .addTag('Product')
      .addTag('Category')
      .addTag('Status')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/swagger', app, document);

    logger.log(
      `Swagger documentation is available at http://localhost:${PORT}/swagger`,
    );
  }

  if (envVars.IS_CORS_ENABLED) {
    app.enableCors();
  }

  app.enableShutdownHooks();

  await app.listen(PORT);
  logger.log(`App listening on port ${PORT}`);
}

bootstrap().catch((error: Error) => {
  logger.error('Failed to bootstrap Nest application', error.stack);
  process.exit(1);
});
