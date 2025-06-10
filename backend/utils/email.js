const nodemailer = require("nodemailer");
const htmlToText = require("html-to-text");
const BrevoTransport = require("nodemailer-sendinblue-transport");

const baseTemplate = require("../email-templates/base-template");
const welcomeTemplate = require("../email-templates/welcome-template");
const passwordResetTemplate = require("../email-templates/passwordReset-template");
const verificationOtpTemplate = require("../email-templates/verificationOtp-template");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `TravelPulse <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // Use Brevo for production
      return nodemailer.createTransport(
        new BrevoTransport({ apiKey: process.env.BREVO_API_KEY })
      );
    }

    // Check if SendGrid API key exists
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY is not set in environment variables");
    }

    // Use SendGrid for development
    return nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: "apikey", // This is literally the string "apikey"
        pass: process.env.SENDGRID_API_KEY, // Your SendGrid API key
      },
      // Add debug options
      debug: true,
      logger: true,
    });
  }

  async send(content, subject) {
    const html = baseTemplate(content, this.firstName, this.url);

    // email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: htmlToText.convert(html),
      html,
    };

    try {
      // create transport and send email
      const transporter = this.newTransport();
      
      
      const result = await transporter.sendMail(mailOptions);
      // console.log("✅ Email sent successfully:", result.messageId);
      return result;
    } catch (error) {
      console.error("❌ Email sending failed:", error);
      throw error;
    }
  }

  async sendWelcome() {
    console.log(`🎉 Welcome email triggered for: ${this.to}`);
    await this.send(welcomeTemplate, "Welcome to TravelPulse family!");
  }

  async sendPasswordReset() {
    console.log(`🔐 Password reset email triggered for: ${this.to}`);
    await this.send(
      passwordResetTemplate,
      "Your password reset token (valid for 10 mins)."
    );
  }

  async sendVerificationCode() {
    console.log(`✉️ Verification email triggered for: ${this.to}`);
    await this.send(
      verificationOtpTemplate,
      "Your email verification OTP (valid for 10 mins)."
    );
  }
};