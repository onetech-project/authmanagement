import nodemailer from "nodemailer";

// async..await is not allowed in global scope, must use a wrapper
const maintest = async (recipient, text, html, subject) => {
  try {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    const testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });

    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: '"Fred Foo 👻" <foo@example.com>', // sender address
      to: recipient, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  } catch (error) {
    throw error;
  }
};

const main = async (recipient, text, html, subject) => {
  try {
    const transporter = nodemailer.createTransport({
      // host: "smtp.ethereal.email",
      // port: 587,
      // secure: false, // true for 465, false for other ports
      service: "gmail",
      auth: {
        user: "your.email@domain.com",
        pass: "your-email-password",
      },
    });

    // send mail with defined transport object
    await transporter.sendMail({
      from: "your.email@domain.com", // sender address
      to: recipient, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });
  } catch (error) {
    throw error;
  }
};

export default { main, maintest };
