import { INestApplication } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/users/entities/user.entity';
import { DataSource } from 'typeorm';
import { userSaved } from './data';

export const tokenForUser = (
  app: INestApplication,
  user: Partial<User> = userSaved,
): string => {
  return app.get(AuthService).getTokenForUser(user as User);
};

export const cleanDatabase = async (connection: DataSource) => {
  const queryRunner = connection.createQueryRunner();
  await queryRunner.connect();
  try {
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = connection.entityMetadatas.map((e) => e.tableName);
    for (const table of tables) {
      await queryRunner.query(`DELETE FROM \`${table}\`;`);
    }
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    await queryRunner.release();
  }
};

export const loadFixtures = async (
  connection: DataSource,
  sqlFileName: string,
) => {
  const sql = fs.readFileSync(
    path.join(__dirname, '../fixtures', sqlFileName),
    'utf8',
  );

  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const queryRunner = connection.createQueryRunner();
  await queryRunner.connect();
  try {
    for (const statement of statements) {
      await queryRunner.query(statement);
    }
  } finally {
    await queryRunner.release();
  }
};
