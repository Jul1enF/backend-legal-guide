const nodemailer = require('nodemailer');

const appEmail = process.env.APP_EMAIL
const emailPassword = process.env.EMAIL_PASSWORD

const emailTransporter = nodemailer.createTransport({
  service:'gmail',
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth:{
    user : appEmail,
    pass : emailPassword,
  }
})


const sendContactMail = async (names, email, phone, subject, message, recipient) => {

    let phoneContact = ""

    if (phone){
        phoneContact = `  <div style="margin : 0 auto 15px; width : fit-content">
        <h2 style="text-align:center ; margin-bottom:10px ; font-size: 22px ; display: inline ;">Numéro de téléphone :</h2>
          <h3 style="text-align:center ; margin-bottom:10px ; font-size: 22px ; font-weight : 300 ; display: inline ;">${phone}</h3>
  </div>`
    }



    const mailOptions = {
        from: appEmail,
        to: `${recipient}`,
        subject: "App Me Baudelin - Vous avez reçu un nouveau formulaire de contact",
        html: `
        <body style="font-family: arial; margin-bottom : 50px">
      <div style="width: 100%;
    height: 100px; background-color: black; margin:0; padding:0; margin-bottom:30px ;">
        <h1 style="color:white; margin:0; padding:0; width:100%; text-align:center; padding-top:25px; font-size:35px; ">Nouveau formulaire de contact</h1>
      </div>

        
        <h2 style="width:100%; text-align:center; margin-bottom:50px ; font-size: 23px; text-decoration-line: underline ; text-underline-offset: 10px;">Vous avez reçu un nouveau formulaire de contact :</h2>
        
        <div style="margin : 0 auto 15px; width : fit-content">
        <h2 style="text-align:center ; margin-bottom:10px ; font-size: 22px ; display: inline ;">Requérant :</h2>
          <h3 style="text-align:center ; margin-bottom:10px ; font-size: 22px ; font-weight : 300 ; display: inline ;">${names}</h3>
  </div>
  
  <div style="margin : 0 auto 15px; width : fit-content">
        <h2 style="text-align:center ; margin-bottom:10px ; font-size: 22px ; display: inline ;">Email :</h2>
          <h3 style="text-align:center ; margin-bottom:10px ; font-size: 22px ; font-weight : 300 ; display: inline ;">${email}</h3>
  </div>
  
  ${phoneContact}
  
    <div style="margin : 0 auto 25px; width : fit-content">
        <h2 style="text-align:center ; margin-bottom:10px ; font-size: 22px ; display: inline ;">Sujet :</h2>
          <h3 style="text-align:center ; margin-bottom:10px ; font-size: 22px ; font-weight : 300 ; display: inline ;">${subject}</h3>
  </div>
  
  <h2 style="text-align:center ; margin : 0 0 10px ; font-size: 22px ; width : 100%">Message :</h2>
   <h3 style="text-align:center ; margin : 0 ; font-size: 22px ; font-weight : 300 ; width : 100%">${message}</h3>
  
      </body>
      `
    }

    await emailTransporter.sendMail(mailOptions)

}


module.exports = { sendContactMail }