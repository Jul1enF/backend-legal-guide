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
        if ( mongoose.connection.readyState !== 1 ){
            console.log("NO DB CONNEXION")
            await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })
        }


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
        if ( mongoose.connection.readyState !== 1 ){
            console.log("NO DB CONNEXION")
            await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })
        }


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




// Route pour modifier les informations d'un utilisateur

router.put('/modify-user', async (req, res) => {
    try {
        if ( mongoose.connection.readyState !== 1 ){
            console.log("NO DB CONNEXION")
            await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })
        }


        const { name, firstname, email, oldPassword, password, jwtToken, phone } = req.body

        const decryptedToken = jwt.verify(jwtToken, secretToken)
        let user = await User.findOne({ token: decryptedToken.token })

        // Vérification que l'utilisateur postant est bien trouvé
        if (!user) { return res.json({ result: false, error: 'Utilisateur non trouvé. Essayez en vous reconnectant.' }) }

        user.name = name
        user.firstname = firstname
        user.email = email
        user.phone = phone


        // Comparaison 

        if (oldPassword && !bcrypt.compareSync(oldPassword, user.password)) {
            res.json({ result: false, error: "Ancien mot de passe incorrect !" })
            return
        }

        if (password) {
            const hash = bcrypt.hashSync(password, 10)
            user.password = hash
        }

        await user.save()

        res.json({ result: true })

    } catch (err) {
        console.log(err)
        res.json({ result: false, err })
    }

})




// Route pour supprimer un utilisateur


router.delete('/delete-user/:jwtToken', async (req, res) => {
    try {

        if ( mongoose.connection.readyState !== 1 ){
            console.log("NO DB CONNEXION")
            await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })
        }


        const { jwtToken } = req.params

        const decryptedToken = jwt.verify(jwtToken, secretToken)
        let user = await User.findOne({ token: decryptedToken.token })

        // Vérification que l'utilisateur postant est bien trouvé
        if (!user) { return res.json({ result: false, error: 'Utilisateur non trouvé, essayez en vous reconnectant.' }) }

        const suppress = await User.deleteOne({ token: decryptedToken.token })

        if (suppress.deletedCount !== 1) {
            res.json({ result: false, error: "Problème de connexion à la base de donnée, merci de réessayer ultérieurement ou de contacter l'Éditeur de l'application." })

            return
        }
        else {
            res.json({ result: true })
        }

    } catch (err) {
        console.log(err)
        res.json({ result: false, err })
    }
})




// Route pour modifier le push token d'un utilisateur

router.put('/changePushToken', async (req, res) => {
    try {
        if ( mongoose.connection.readyState !== 1 ){
            console.log("NO DB CONNEXION")
            await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })
        }

        const { jwtToken, push_token } = req.body

        const decryptedToken = jwt.verify(jwtToken, secretToken)

        const userData = await User.findOne({ token: decryptedToken.token })

        if (!userData) {
            res.json({ result: false, error: "Token de connexion non valide !" })
        }
        else {
            userData.push_token = push_token

            await userData.save()

            res.json({ result: true })
        }
    } catch (err) { res.json({ err }) }
})



module.exports = router