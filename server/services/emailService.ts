/**
 * Email сервис для отправки уведомлений
 * Поддерживает разные провайдеры (SMTP, SendGrid, Resend и т.д.)
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private isEnabled = !!process.env.EMAIL_FROM && !!process.env.SMTP_HOST;
  private from = process.env.EMAIL_FROM || 'noreply@ridetogether.ru';
  private provider = process.env.EMAIL_PROVIDER || 'smtp';

  /**
   * Отправка email через SMTP
   */
  private async sendViaSMTP(options: EmailOptions): Promise<void> {
    const nodemailer = await import('nodemailer').catch(() => null);
    if (!nodemailer) {
      throw new Error('nodemailer не установлен. Установите: npm install nodemailer');
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true для 465, false для других портов
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });
  }

  /**
   * Отправка email через Resend (рекомендуется)
   */
  private async sendViaResend(options: EmailOptions): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY не установлен');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }
  }

  /**
   * Отправка email
   */
  async send(options: EmailOptions): Promise<void> {
    if (!this.isEnabled) {
      console.warn('Email service не настроен. Пропускаем отправку:', options.to);
      return;
    }

    try {
      switch (this.provider) {
        case 'resend':
          await this.sendViaResend(options);
          break;
        case 'smtp':
        default:
          await this.sendViaSMTP(options);
          break;
      }
    } catch (error) {
      console.error('Ошибка отправки email:', error);
      throw error;
    }
  }

  /**
   * Отправка уведомления о новом бронировании водителю
   */
  async sendBookingNotificationToDriver(
    driverEmail: string,
    driverName: string,
    passengerName: string,
    rideFrom: string,
    rideTo: string,
    rideDate: string
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0d9488; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Ride Together</h1>
            </div>
            <div class="content">
              <h2>Новое бронирование!</h2>
              <p>Здравствуйте, ${driverName}!</p>
              <p>У вас новое бронирование на поездку:</p>
              <ul>
                <li><strong>Пассажир:</strong> ${passengerName}</li>
                <li><strong>Маршрут:</strong> ${rideFrom} → ${rideTo}</li>
                <li><strong>Дата:</strong> ${rideDate}</li>
              </ul>
              <a href="https://ridetogether.ru/my-rides" class="button">Посмотреть в приложении</a>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.send({
      to: driverEmail,
      subject: 'Новое бронирование на вашу поездку',
      html,
    });
  }

  /**
   * Отправка подтверждения бронирования пассажиру
   */
  async sendBookingConfirmationToPassenger(
    passengerEmail: string,
    passengerName: string,
    driverName: string,
    rideFrom: string,
    rideTo: string,
    rideDate: string,
    rideTime: string
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0d9488; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Ride Together</h1>
            </div>
            <div class="content">
              <h2>Бронирование подтверждено!</h2>
              <p>Здравствуйте, ${passengerName}!</p>
              <p>Ваше бронирование подтверждено:</p>
              <ul>
                <li><strong>Водитель:</strong> ${driverName}</li>
                <li><strong>Маршрут:</strong> ${rideFrom} → ${rideTo}</li>
                <li><strong>Дата:</strong> ${rideDate}</li>
                <li><strong>Время:</strong> ${rideTime}</li>
              </ul>
              <a href="https://ridetogether.ru/my-bookings" class="button">Посмотреть в приложении</a>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.send({
      to: passengerEmail,
      subject: 'Бронирование подтверждено',
      html,
    });
  }

  /**
   * Отправка напоминания о поездке
   */
  async sendRideReminder(
    email: string,
    name: string,
    rideFrom: string,
    rideTo: string,
    rideDate: string,
    rideTime: string,
    isDriver: boolean
  ): Promise<void> {
    const role = isDriver ? 'водителю' : 'пассажиру';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0d9488; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Ride Together</h1>
            </div>
            <div class="content">
              <h2>Напоминание о поездке</h2>
              <p>Здравствуйте, ${name}!</p>
              <p>Напоминаем вам о предстоящей поездке (через 24 часа):</p>
              <ul>
                <li><strong>Маршрут:</strong> ${rideFrom} → ${rideTo}</li>
                <li><strong>Дата:</strong> ${rideDate}</li>
                <li><strong>Время:</strong> ${rideTime}</li>
              </ul>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.send({
      to: email,
      subject: `Напоминание о поездке (${role})`,
      html,
    });
  }
}

export const emailService = new EmailService();

