import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv'
dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('INVENTA')
    .setDescription('Your API description')
    .setVersion('1.0')
    .addSecurityRequirements("bearer",['bearer'])
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // `localhost:3000/api` orqali ko'riladi

  await app.listen(process.env.PORT||3000);
}

bootstrap()