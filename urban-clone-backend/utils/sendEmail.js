const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 2. Define the email options
    const mailOptions = {
      from: `"Urban Clone Team" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html, // We send HTML, not plain text, to make it look professional
    };

    // 3. Actually send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email: ", error);
  }
};

module.exports = sendEmail;
