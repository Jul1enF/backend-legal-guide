var express = require('express');
var router = express.Router()

const Emergency = require('../models/emergencies')
const User = require('../models/users')

const jwt = require('jsonwebtoken')
const secretKey = process.env.JWT_SECRET_KEY


const { sendNotifications } = require('../modules/sendNotifications')
const { sendEmergencyMail } = require('../modules/sendMail')


const mongoose = require('mongoose')
const connectionString = process.env.CONNECTION_STRING


// Firebase

const { initializeApp } = require('firebase/app')
const { getStorage, ref, getDownloadURL, uploadBytes, deleteObject } = require("firebase/storage")

const firebaseConfig = require('../config/firebase-config');

//Initialize a firebase application
initializeApp(firebaseConfig);

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage();






router.post('/new-emergency', async (req, res) => {

    try {
        await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })

        const { user_firstname, user_name, user_email, user_phone, connected, media_type, media_name, media_url, emergency_reason, user_location } = req.body


        // Enregistrement en bdd de la demande
        const createdAt = new Date()

        const newEmergency = new Emergency({
            user_firstname, user_name, user_email, user_phone, connected, media_url, media_type, media_name, emergency_reason, createdAt, user_location, located: user_location.length > 0 ? true : false, last_location_date: new Date(),
        })

        const savedEmergency = await newEmergency.save()




        // Envoi d'une notification aux admins

        const emergenciesCount = await Emergency.countDocuments()
        console.log("Emergencies count", emergenciesCount)
        const requestWord = emergenciesCount === 1 ? "demande" : "demandes"

        const title = "URGENT - Demande de contact"

        const message = `Nouvelle requête de ${user_firstname} ${user_name}. Motif : "${emergency_reason}".\nVous avez actuellement ${emergenciesCount} ${requestWord} de contact urgent.`

        // await sendNotifications(title, message)



        // Envoi d'un email au cabinet

        let locationString = ""

        if (user_location.length > 0) {
            locationString = `${user_location[0]} ; ${user_location[1]}`
        }

        // await sendEmergencyMail("alexis@baudelinavocat.fr", user_firstname, user_name, user_phone, connected, emergency_reason, user_email, locationString, media_url)

        // await sendEmergencyMail("j.furic@gmail.com", user_firstname, user_name, user_phone, connected, emergency_reason, user_email, locationString, media_url)


        res.json({ result: true, savedEmergency })


    } catch (err) {
        console.log(err)
        res.json({ result: false, err })
    }
})





// Route pour vérifier la présence d'une demande d'urgence
router.get('/check-emergency/:emergency_id', async (req, res) => {
    try {
        await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })

        const { emergency_id } = req.params

        let requestDeleted = false

        if (emergency_id) {
            const emergency = await Emergency.findOne({ _id: emergency_id })

            if (!emergency) {
                requestDeleted = true
            }
        }
        console.log("deleted", requestDeleted)
        res.json({ result: true, requestDeleted })


    } catch (err) {
        console.log(err)
        res.json({ result: false, err })
    }
})






// Route pour supprimer une demande d'urgence

router.delete('/suppress-emergency/:_id', async (req, res) => {
    try {
        await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })

        const { _id } = req.params


        // Vérification de l'éventuelle présence d'un média enregistré sur firebase pour le supprimer
        const emergency = await Emergency.findOne({ _id })

        if (emergency.media_url) {
            const mediaRef = ref(storage, `emergenciesMedias/${emergency.media_name}`)

            const mediaSupress = await deleteObject(mediaRef)
        }


        // Suppression du document emergencies
        const suppress = await Emergency.deleteOne({ _id })

        if (suppress.deletedCount !== 1) {
            return res.json({ result: false })
        }

        res.json({ result: true })

    } catch (err) {
        console.log(err)
        res.json({ result: false, err })
    }
})




// Route pour obtenir toutes les demandes d'urgences

router.get('/get-emergencies/:jwtToken', async (req, res) => {
    try {
        await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })

        const { jwtToken } = req.params

        const decryptedToken = jwt.verify(jwtToken, secretKey)
        let user = await User.findOne({ token: decryptedToken.token })

        // Vérification que l'utilisateur postant est bien admin
        if (!user || !user.is_admin) { return res.json({ result: false, error: 'Données non téléchargées. Utilisateur non autorisé. Essayez en vous reconnectant.' }) }

        let emergencies = await Emergency.find()

        if (!emergencies) {
            emergencies = []
        }

        res.json({ result: true, emergencies })

    } catch (err) {
        console.log(err)
        res.json({ result: false, err })
    }
})





// Route pour actualiser la localisation d'un utilisateur

router.put('/update-location', async (req, res) => {

    try {
        await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })

        const { _id, user_location } = req.body

        const emergencyToUpdate = await Emergency.findOne({ _id })

        if (!emergencyToUpdate){
            res.json({ result: false, error : "No more emergency in data base" })
        }else{
            emergencyToUpdate.user_location = user_location
            emergencyToUpdate.last_location_date = new Date()
            await emergencyToUpdate.save()

            console.log("DATE", new Date())

            res.json({ result: true})
        }

    } catch (err) {
        console.log(err)
        res.json({ result: false, err })
    }
})




module.exports = router;