import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST', 'smtp.gmail.com'),
      port: parseInt(config.get('SMTP_PORT', '587')),
      secure: false,
      auth: {
        user: config.get('SMTP_USER'),
        pass: config.get('SMTP_PASS'),
      },
    });
  }

  async sendVerificationEmail(email: string, displayName: string, token: string) {
    const baseUrl = this.config.get('APP_URL', 'http://45.143.11.97:3001');
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: `"WortKrieg" <${this.config.get('SMTP_USER')}>`,
      to: email,
      subject: 'E-posta adresinizi doğrulayın — WortKrieg',
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0D1B2A; color: #FFFFFF; border-radius: 16px; padding: 32px;">
          <h1 style="color: #1A73E8; margin-bottom: 8px;">Hoş geldin, ${displayName}! 🎓</h1>
          <p style="color: #B0BEC5; margin-bottom: 24px;">WortKrieg'e kayıt olduğun için teşekkürler. Hesabını aktive etmek için aşağıdaki butona tıkla.</p>
          <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #1A73E8, #00BCD4); color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 16px;">E-postamı Doğrula</a>
          <p style="color: #B0BEC5; margin-top: 24px; font-size: 14px;">Bu link 24 saat geçerlidir. Eğer bu işlemi sen yapmadıysan bu e-postayı yoksay.</p>
          <hr style="border: 1px solid #243447; margin: 24px 0;">
          <p style="color: #757575; font-size: 12px;">WortKrieg — Almanca öğrenmenin en eğlenceli yolu</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, displayName: string, token: string) {
    const baseUrl = this.config.get('APP_URL', 'http://45.143.11.97:3001');
    const resetUrl = `${baseUrl}/api/auth/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: `"WortKrieg" <${this.config.get('SMTP_USER')}>`,
      to: email,
      subject: 'Şifre sıfırlama — WortKrieg',
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0D1B2A; color: #FFFFFF; border-radius: 16px; padding: 32px;">
          <h1 style="color: #FF6D00; margin-bottom: 8px;">Şifre Sıfırlama</h1>
          <p style="color: #B0BEC5; margin-bottom: 8px;">Merhaba ${displayName},</p>
          <p style="color: #B0BEC5; margin-bottom: 24px;">Şifre sıfırlama talebinde bulundun. Aşağıdaki butona tıklayarak yeni şifreni belirleyebilirsin.</p>
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #FF6D00, #FFB300); color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 16px;">Şifremi Sıfırla</a>
          <p style="color: #B0BEC5; margin-top: 24px; font-size: 14px;">Bu link 1 saat geçerlidir. Eğer bu işlemi sen yapmadıysan bu e-postayı yoksay.</p>
          <hr style="border: 1px solid #243447; margin: 24px 0;">
          <p style="color: #757575; font-size: 12px;">WortKrieg — Almanca öğrenmenin en eğlenceli yolu</p>
        </div>
      `,
    });
  }
}
