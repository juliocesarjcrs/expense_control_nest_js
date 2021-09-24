import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserCode(user: User, code: number) {
    const resp = await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: '¡Bienvenido App Control gastos! Código de recuperación',
      template: './sendCode', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        name: user.name,
        code,
      },
    });
    return resp;
  }
}
