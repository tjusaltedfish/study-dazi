import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM || 'Study-DaZi <noreply@study-dazi.app>';

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  if (!resend) {
    throw new Error('RESEND_API_KEY 未配置');
  }
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Study-DaZi 邮箱验证码',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Study-DaZi 邮箱验证</h2>
        <p>你的验证码是：</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#6366F1">${code}</p>
        <p>验证码 10 分钟内有效，请勿转发给他人。</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  if (!resend) {
    throw new Error('RESEND_API_KEY 未配置');
  }
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Study-DaZi 密码重置',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Study-DaZi 密码重置</h2>
        <p>点击下方链接重置密码（30 分钟内有效）：</p>
        <p><a href="${resetUrl}" style="color:#6366F1">重置密码</a></p>
        <p>如果这不是你发起的请求，请忽略此邮件。</p>
      </div>
    `,
  });
}
