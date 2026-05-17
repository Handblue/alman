import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { Response } from 'express';
import { AuthService } from './auth.service';

class RegisterDto {
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin' })
  email: string;

  @IsString()
  @MinLength(2, { message: 'Ad en az 2 karakter olmalıdır' })
  firstName: string;

  @IsString()
  @MinLength(2, { message: 'Soyad en az 2 karakter olmalıdır' })
  lastName: string;

  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  password: string;

  @IsOptional()
  @IsString()
  username?: string;
}

class LoginDto {
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin' })
  email: string;

  @IsString()
  password: string;
}

class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  newPassword: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Kayıt ol' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Giriş yap' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'E-posta doğrulama (link üzerinden)' })
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    try {
      const result = await this.authService.verifyEmail(token);
      // Başarı sayfasına yönlendir (ileride deep link eklenebilir)
      return res.send(`
        <html>
          <head><title>WortKrieg — E-posta Doğrulandı</title></head>
          <body style="font-family: Inter, Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0D1B2A; margin: 0;">
            <div style="text-align: center; color: #FFFFFF; padding: 32px;">
              <h1 style="color: #2E7D32; font-size: 48px; margin-bottom: 16px;">✓</h1>
              <h2 style="margin-bottom: 8px;">E-posta Doğrulandı!</h2>
              <p style="color: #B0BEC5;">Hesabın başarıyla aktive edildi. Uygulamaya dönüp giriş yapabilirsin.</p>
              <p style="color: #B0BEC5; font-size: 14px; margin-top: 16px;">Bu sayfayı kapatabilirsin.</p>
            </div>
          </body>
        </html>
      `);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Bir hata oluştu';
      return res.status(400).send(`
        <html>
          <head><title>WortKrieg — Hata</title></head>
          <body style="font-family: Inter, Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0D1B2A; margin: 0;">
            <div style="text-align: center; color: #FFFFFF; padding: 32px;">
              <h1 style="color: #FF5252; font-size: 48px; margin-bottom: 16px;">✗</h1>
              <h2 style="margin-bottom: 8px;">Doğrulama Başarısız</h2>
              <p style="color: #B0BEC5;">${errMsg}</p>
            </div>
          </body>
        </html>
      `);
    }
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Doğrulama e-postasını tekrar gönder' })
  async resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerification(body.email);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Şifre sıfırlama e-postası gönder' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Yeni şifre belirle' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
