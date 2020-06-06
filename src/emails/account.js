// require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

const sendWelcomingEmail = (name, email) => {

   const mailOptions = {
        from: 'karansaini08.12.1998@gmail.com',
        to: email,
        subject: 'Welcoming Message',
        text: `Welcome ${name} Your account has been created.`
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}

const sendCancellationEmail = (name, email) => {

  const mailOptions = {
       from: 'karansaini08.12.1998@gmail.com',
       to: email,
       subject: 'Cancellation Message',
       text: `${name} Your account has been removed. Can you mention the reason of removing it`
   };

   transporter.sendMail(mailOptions, function(error, info){
       if (error) {
         console.log(error);
       } else {
         console.log('Email sent: ' + info.response);
       }
     });
}


module.exports = {
    sendWelcomingEmail,
    sendCancellationEmail
}