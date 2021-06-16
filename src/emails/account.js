const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (name, email) => {
   const msg = {
      to: email,
      from: process.env.USER_EMAIL,
      subject: 'WELCOME!',
      text: `Welcome to our Task Application, ${name} nice to see you here.`,
   };

   sgMail
      .send(msg)
      .then(() => console.log('Email send'))
      .catch(error => console.log(error));
};

const sendCancelEmail = (name, email) => {
   const msg = {
      to: email,
      from: process.env.USER_EMAIL,
      subject: 'Good Bye :(',
      text: `It was so nice to have you here ${name}, If there is anything that we could do to make things better please don't hesitate to inform us.`,
   };

   sgMail
      .send(msg)
      .then(() => console.log('Email send'))
      .catch(error => console.log(error));
};

module.exports = {
   sendWelcomeEmail,
   sendCancelEmail,
};
