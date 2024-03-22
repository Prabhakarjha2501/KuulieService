const nodemailer = require("nodemailer");

const getEmailAccount = async () => {
    const host = process.env.EMAIL_HOST, user = process.env.EMAIL_USER_NAME, pass = process.env.EMAIL_PASSWORD;
    return {
        host,
        auth: {
            user,
            pass
        }
    }
}

const sendMail = async (email, subject, html, text, attachments) => {
    try {
        const { host, auth } = await getEmailAccount();
        const transporter = nodemailer.createTransport({
            host,
            port: 587,
            secure: false,
            auth,
        });
        const info = await transporter.sendMail({
            from: auth.user,
            to: email,
            subject: subject,
            text,
            html,
            attachments
        });
        return true;
    } catch (error) {
        console.log(error, "email not sent");
        return false;
    }
}

module.exports = {
    sendMail
}
