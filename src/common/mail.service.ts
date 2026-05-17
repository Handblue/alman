import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly apiKey: string;
  private readonly fromEmail: string;

  constructor(private config: ConfigService) {
    this.apiKey = config.get('RESEND_API_KEY', '');
    this.fromEmail = config.get('FROM_EMAIL', 'WortKrieg <noreply@wortkrieg.app>');
  }

  private async sendMail(to: string, subject: string, html: string): Promise<void> {
    if (!this.apiKey) {
      console.log(`[DEV] E-posta gönderilecekti: ${to} | ${subject}`);
      return;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.fromEmail,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Resend hatası: ${JSON.stringify(err)}`);
    }
  }

  async sendVerificationEmail(email: string, displayName: string, token: string) {
    const baseUrl = this.config.get('APP_URL', 'http://45.143.11.97');
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    await this.sendMail(
      email,
      'E-posta adresinizi doğrulayın — WortKrieg',
      `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0D1B2A; color: #FFFFFF; border-radius: 16px; padding: 32px;">
        <h1 style="color: #1A73E8; margin-bottom: 8px;">Hoş geldin, ${displayName}! 🎓</h1>
        <p style="color: #B0BEC5; margin-bottom: 24px;">WortKrieg'e kayıt olduğun için teşekkürler. Hesabını aktive etmek için aşağıdaki butona tıkla.</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #1A73E8; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 16px;">E-postamı Doğrula</a>
        <p style="color: #B0BEC5; margin-top: 24px; font-size: 14px;">Bu link 24 saat geçerlidir.</p>
        <hr style="border: 1px solid #243447; margin: 24px 0;">
        <p style="color: #757575; font-size: 12px;">WortKrieg — Almanca öğrenmenin en eğlenceli yolu</p>
      </div>
      `,
    );
  }

  async sendPasswordResetEmail(email: string, displayName: string, token: string) {
    const baseUrl = this.config.get('APP_URL', 'http://45.143.11.97');
    const resetUrl = `${baseUrl}/api/auth/reset-password-page?token=${token}`;

    await this.sendMail(
      email,
      'Şifre sıfırlama — WortKrieg',
      `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0D1B2A; color: #FFFFFF; border-radius: 16px; padding: 32px;">
        <h1 style="color: #FF6D00; margin-bottom: 8px;">Şifre Sıfırlama</h1>
        <p style="color: #B0BEC5; margin-bottom: 8px;">Merhaba ${displayName},</p>
        <p style="color: #B0BEC5; margin-bottom: 24px;">Şifre sıfırlama talebinde bulundun.</p>
        <a href="${resetUrl}" style="display: inline-block; background: #FF6D00; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 16px;">Şifremi Sıfırla</a>
        <p style="color: #B0BEC5; margin-top: 24px; font-size: 14px;">Bu link 1 saat geçerlidir.</p>
        <hr style="border: 1px solid #243447; margin: 24px 0;">
        <p style="color: #757575; font-size: 12px;">WortKrieg — Almanca öğrenmenin en eğlenceli yolu</p>
      </div>
      `,
    );
  }
}
