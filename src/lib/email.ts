import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is not set');
}

const resend = new Resend(process.env.RESEND_API_KEY);


export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  try {
  console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY);

    const defaultFrom = 'Swimology <swimology@oaklabs.app>';
    const result = await resend.emails.send({
      from: from || defaultFrom,
      to,
      subject,
      html,
    });
    console.log("Email sent successfully:", result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

// Email template for welcome emails
export async function sendWelcomeEmail(email: string, name: string) {
  const html = `
    <div>
      <h1>Welcome to Swimology!</h1>
      <p>Hi ${name},</p>
      <p>We're excited to have you on board. Get started by exploring your dashboard and setting up your profile.</p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br/>The Swimology Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Swimology',
    html,
  });
}

// Email template for password reset
export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const html = `
    <div>
      <h1>Reset Your Password</h1>
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <p><a href="${resetLink}">Reset Password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>Best regards,<br/>The Swimology Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - Swimology',
    html,
  });
}

// Email template for lesson confirmation
export async function sendLessonConfirmationEmail(email: string, lessonDetails: {
  date: string;
  time: string;
  instructor: string;
  level: string;
}) {
  const html = `
    <div>
      <h1>Lesson Confirmation</h1>
      <p>Your lesson has been scheduled!</p>
      <p>Details:</p>
      <ul>
        <li>Date: ${lessonDetails.date}</li>
        <li>Time: ${lessonDetails.time}</li>
        <li>Instructor: ${lessonDetails.instructor}</li>
        <li>Level: ${lessonDetails.level}</li>
      </ul>
      <p>We look forward to seeing you!</p>
      <p>Best regards,<br/>The Swimology Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Lesson Confirmation - Swimology',
    html,
  });
} 