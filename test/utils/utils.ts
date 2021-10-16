import { INestApplication } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/users/entities/user.entity';
import { Connection } from 'typeorm';
import { userSaved } from './data';

export const tokenForUser = (
  app: INestApplication,
  user: Partial<User> = userSaved,
): string => {
  return app.get(AuthService).getTokenForUser(user as User);
};

export const loadFixtures = async (
  connection: Connection,
  sqlFileName: string,
) => {
  const sql = fs.readFileSync(
    path.join(__dirname, '../fixtures', sqlFileName),
    'utf8',
  );

  const queryRunner = connection.driver.createQueryRunner('master');

  for (const c of sql.split(';')) {
    await queryRunner.query(c);
  }
};
