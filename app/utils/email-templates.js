const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.IMAP_EMAIL,
    pass: process.env.IMAP_PASS,
  },
});

async function sendResetPasswordEmail(userEmail, token) {
  const resetUrl = `http://localhost:3030/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.IMAP_EMAIL,
    to: userEmail,
    subject: "Password Reset Request",
    text: `You requested a password reset. Click the link to reset your password: ${resetUrl}`,
    html: `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset for your account. Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="text-decoration: none; color: #2d7ed8;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Reset password email sent:", info.response);
  } catch (error) {
    console.error("Error sending reset password email:", error);
  }
}

module.exports = {
  sendResetPasswordEmail,
};
