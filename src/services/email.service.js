const nodemailer = require('nodemailer');
const config = require('../config/env');

/**
 * Email Service - Handles sending emails
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.initTransporter();
    }

    /**
     * Initialize email transporter
     */
    initTransporter() {
        if (config.email.service && config.email.user && config.email.password) {
            // Use real email service (Gmail, SendGrid, etc.)
            this.transporter = nodemailer.createTransport({
                service: config.email.service,
                auth: {
                    user: config.email.user,
                    pass: config.email.password,
                },
            });
            this.isReady = true;
        } else {
            this.createEtherealTransporter();
        }
    }

    /**
     * Create ethereal test account for development
     */
    async createEtherealTransporter() {
        try {
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            this.isReady = true;
        } catch (error) {
            this.isReady = false;
        }
    }

    /**
     * Wait for transporter to be ready
     */
    async waitForReady() {
        // If using real SMTP, it's ready immediately
        if (config.email.service && config.email.user && config.email.password) {
            return;
        }

        // Wait for Ethereal to be ready
        let attempts = 0;
        while (!this.isReady && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

        if (!this.isReady) {
            throw new Error('Email service failed to initialize');
        }
    }

    /**
     * Send OTP email
     */
    async sendOtpEmail(to, otp, userName = 'User') {
        try {
            // Wait for transporter to be ready
            await this.waitForReady();

            const mailOptions = {
                from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
                to,
                subject: 'Xác thực tài khoản - Mã OTP',
                html: this.getOtpEmailTemplate(otp, userName),
            };

            const info = await this.transporter.sendMail(mailOptions);

            if (config.nodeEnv !== 'production') {
                console.log('📧 Email sent: %s', info.messageId);
                console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
            }

            return {
                success: true,
                messageId: info.messageId,
                previewUrl: nodemailer.getTestMessageUrl(info),
            };
        } catch (error) {
            console.error('❌ Error sending OTP email:', error);
            throw new Error('Failed to send OTP email');
        }
    }

    /**
     * Send welcome email
     */
    async sendWelcomeEmail(to, userName) {
        try {
            // Wait for transporter to be ready
            await this.waitForReady();

            const mailOptions = {
                from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
                to,
                subject: 'Chào mừng bạn đến với Tutor Platform!',
                html: this.getWelcomeEmailTemplate(userName),
            };

            const info = await this.transporter.sendMail(mailOptions);

            if (config.nodeEnv !== 'production') {
                console.log('📧 Welcome email sent: %s', info.messageId);
                console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
            }

            return {
                success: true,
                messageId: info.messageId,
            };
        } catch (error) {
            console.error('❌ Error sending welcome email:', error);
            // Don't throw error for welcome email
            return { success: false };
        }
    }

    /**
     * OTP email template
     */
    getOtpEmailTemplate(otp, userName) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .otp-box { background: white; border: 2px dashed #4CAF50; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { color: #f44336; font-size: 14px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Tutor Platform</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${userName}!</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Tutor Platform</strong>.</p>
            <p>Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP dưới đây:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #666;">Mã có hiệu lực trong 10 phút</p>
            </div>
            
            <p class="warning">
              ⚠️ <strong>Lưu ý:</strong> Không chia sẻ mã OTP này với bất kỳ ai. 
              Nhân viên của chúng tôi sẽ không bao giờ yêu cầu mã OTP của bạn.
            </p>
            
            <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
            
            <p>Trân trọng,<br><strong>Tutor Platform Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2026 Tutor Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    /**
     * Welcome email template
     */
    getWelcomeEmailTemplate(userName) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .feature-item { margin: 15px 0; padding-left: 25px; position: relative; }
          .feature-item:before { content: "✓"; position: absolute; left: 0; color: #4CAF50; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Chào mừng đến với Tutor Platform!</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${userName}!</h2>
            <p>Tài khoản của bạn đã được kích hoạt thành công. Chào mừng bạn đến với cộng đồng học tập của chúng tôi!</p>
            
            <div class="features">
              <h3>🚀 Bạn có thể bắt đầu:</h3>
              <div class="feature-item">Tìm kiếm gia sư phù hợp với nhu cầu của bạn</div>
              <div class="feature-item">Xem hồ sơ và đánh giá của các gia sư</div>
              <div class="feature-item">Đặt lịch học trực tuyến dễ dàng</div>
              <div class="feature-item">Theo dõi tiến độ học tập của bạn</div>
            </div>
            
            <center>
              <a href="${config.frontendUrl || 'http://localhost:3000'}" class="button">Bắt đầu ngay</a>
            </center>
            
            <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi qua email này.</p>
            
            <p>Chúc bạn có trải nghiệm học tập tuyệt vời!<br><strong>Tutor Platform Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2026 Tutor Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(to, otp, userName) {
        try {
            // Wait for transporter to be ready
            await this.waitForReady();

            const mailOptions = {
                from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
                to,
                subject: 'Đặt lại mật khẩu - Mã OTP',
                html: this.getPasswordResetEmailTemplate(otp, userName),
            };

            const info = await this.transporter.sendMail(mailOptions);

            if (config.nodeEnv !== 'production') {
                console.log('📧 Password reset email sent: %s', info.messageId);
                console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
            }

            return {
                success: true,
                messageId: info.messageId,
                previewUrl: nodemailer.getTestMessageUrl(info),
            };
        } catch (error) {
            console.error('❌ Error sending password reset email:', error);
            throw new Error('Failed to send password reset email');
        }
    }

    /**
     * Password reset email template
     */
    getPasswordResetEmailTemplate(otp, userName) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .otp-box { background: white; border: 2px solid #f44336; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #f44336; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { color: #f44336; font-size: 14px; margin-top: 15px; background: #ffebee; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Đặt lại mật khẩu</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${userName}!</h2>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <p>Vui lòng sử dụng mã OTP dưới đây để tiếp tục:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #666;">Mã có hiệu lực trong 10 phút</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Cảnh báo bảo mật:</strong><br>
              • Không chia sẻ mã OTP này với bất kỳ ai<br>
              • Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này<br>
              • Liên hệ ngay với chúng tôi nếu bạn nghi ngờ tài khoản bị xâm nhập
            </div>
            
            <p>Trân trọng,<br><strong>Tutor Platform Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2026 Tutor Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
}

module.exports = EmailService;
