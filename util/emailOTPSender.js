const nodemailer = require('nodemailer');

const sendOTPEmail = async (email, otp, subject, title) => {
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_SERVER,
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAIL_ID,
            pass: process.env.MAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: `"Caretimes" <${process.env.MAIL_ID}>`,
        to: email,
        subject: subject,
        text: `Your one-time pin is: ${otp}`,
        html: `
            <div style="font-family: Arial, sans-serif;">
                <h2>${title}</h2>
                <p>Your one-time pin is:</p>
                <h1 style="color: #4CAF50;">${otp}</h1>
                <p>This code will expire in 5 minutes.</p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

module.exports = sendOTPEmail;
