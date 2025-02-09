var express = require('express')
var router = express.Router()

const jwt = require('jsonwebtoken')
const secretToken = process.env.JWT_SECRET_KEY
const bcrypt = require('bcrypt')
const User = require('../models/users')

const mongoose = require('mongoose')
const connectionString = process.env.CONNECTION_STRING




// Route pour ajouter un bookmark

router.put('/addBookmark', async (req, res) => {
    try {
        await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })


        const { _id, jwtToken } = req.body

        const decryptedToken = jwt.verify(jwtToken, secretToken)

        const userData = await User.findOne({ token: decryptedToken.token })

        if (!userData) {
            res.json({ result: false, error: "Problème de connexion, merci de réessayer après vous être reconnecté." })
        }
        else {
            userData.bookmarks.push(_id)

            await userData.save()

            res.json({ result: true })
        }

    } catch (err) {
        console.log(err)
        res.json({ result: false, err, error: "Problème de connexion, merci de réessayer après vous être reconnecté." })
    }
})



// Route pour supprimer un bookmark

router.put('/removeBookmark', async (req, res) => {
    try {
        await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })


        const { _id, jwtToken } = req.body

        const decryptedToken = jwt.verify(jwtToken, secretToken)

        const userData = await User.findOne({ token: decryptedToken.token })

        if (!userData) {
            res.json({ result: false, error: "Problème de connexion, merci de réessayer après vous être reconnecté." })
        }
        else {
            userData.bookmarks = userData.bookmarks.filter(e => e.toString() !== _id)

            await userData.save()

            res.json({ result: true })
        }

    } catch (err) {
        console.log(err)
        res.json({ result: false, err, error: "Problème de connexion, merci de réessayer après vous être reconnecté." })
    }
})



module.exports = router