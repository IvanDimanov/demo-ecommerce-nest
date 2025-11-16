import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KyselyModule } from 'nestjs-kysely';
import { MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';

import { MainDatabaseService } from './main-database.service';

@Module({
  imports: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    KyselyModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: new MysqlDialect({
          pool: createPool({
            database: configService.get<string>('MYSQL_DATABASE'),
            host: configService.get<string>('MYSQL_HOST'),
            port: configService.get<number>('MYSQL_TCP_PORT'),
            user: configService.get<string>('MYSQL_USER'),
            password: configService.get<string>('MYSQL_PASSWORD'),
          }),
        }),
      }),
    }),
  ],
  providers: [MainDatabaseService],
  exports: [MainDatabaseService],
})
export class MainDatabaseModule {}
