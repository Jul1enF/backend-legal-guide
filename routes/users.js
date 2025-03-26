var express = require('express');
var router = express.Router();
const User = require('../models/users')

const mongoose = require('mongoose')
const connectionString = process.env.CONNECTION_STRING

const bcrypt = require('bcrypt')
const uid2 = require('uid2')
const jwt = require('jsonwebtoken')
const secretToken = process.env.JWT_SECRET_KEY




// Route signup pour s'inscrire

router.put('/signup', async (req, res) => {
  try {
    const { firstname, name, email, password, phone } = req.body

    if ( mongoose.connection.readyState !== 1 ){
      console.log("NO DB CONNEXION")
      await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })
  }


    // Vérification que l'utilisateur n'est pas déjà enregistré
    const data = await User.findOne({ email })
    if (data) {
      res.json({
        result: false,
        error: 'Utilisateur déjà enregistré !'
      })
      return
    }
    else {

      const hash = bcrypt.hashSync(password, 10)
      const token = uid2(32)

      const jwtToken = jwt.sign({
        token,
      }, secretToken)

      const newUser = new User({
        firstname,
        name,
        email,
        password: hash,
        inscription_date: new Date(),
        token,
        phone,
      })
      const data = await newUser.save()

      res.json({ result: true, jwtToken, firstname, name, email, is_admin: data.is_admin, phone })
    }
  }
  catch (err) {
    res.json({ err })
    console.log(err)
  }
});






// Route Signin pour se connecter

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body

    if ( mongoose.connection.readyState !== 1 ){
      console.log("NO DB CONNEXION")
      await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })
  }

    const userData = await User.findOne({ email })

    if (!userData || !bcrypt.compareSync(password, userData.password)) {
      res.json({ result: false, error: "Email ou mot de passe incorrect !" })
      return
    }
    else {
      const token = uid2(32)
      const newJwtToken = jwt.sign({
        token,
      }, secretToken)


      userData.token = token

      await userData.save()

      res.json({ result: true, firstname: userData.firstname, name: userData.name, email: userData.email, jwtToken: newJwtToken, is_admin: userData.is_admin, phone: userData.phone, push_token: userData.push_token, bookmarks: userData.bookmarks })

    }
  } catch (err) {
    console.log(err)
    res.json({ result: false, err })
  }
})






module.exports = router;
