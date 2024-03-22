"use strict";
const nodemailer = require("nodemailer");

// async..await is not allowed in global scope, must use a wrapper
module.exports.main = async (toemailAddress) =>{
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.zoho.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: "support@kuulie.com", // generated ethereal user
            pass: "India@21", // generated ethereal password
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: 'support@kuulie.com', // sender address
        to: toemailAddress, // list of receivers
        subject: "Thank you.", // Subject line
        html: `<b>Hello there,</b>
        <p>Thank you for stopping by.</p>
        <p>We'll reach out to you shortly.</p>
        <p>Stay safe.</p>
        <br/>
        </br>
        <p>Kuulie Team`, // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}