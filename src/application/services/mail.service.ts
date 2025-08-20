import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor(private readonly cs: ConfigService) {
    const host = cs.get<string>('MAIL_HOST')!;
    const port = cs.get<number>('MAIL_PORT')!;
    const user = cs.get<string>('MAIL_USER')!;
    const pass = cs.get<string>('MAIL_PASS')!;
    this.from = cs.get<string>('MAIL_FROM')!;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async send(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Mail sent to ${to} messageId=${info.messageId}`);
      return info;
    } catch (e) {
      this.logger.error(`Mail send failed to ${to}: ${e?.message || e}`);
      throw e;
    }
  }
}
