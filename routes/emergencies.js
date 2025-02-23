var express = require('express');
var router = express.Router()

const Emergency = require('../models/emergencies')
const User = require('../models/users')

const jwt = require('jsonwebtoken')
const secretKey = process.env.JWT_SECRET_KEY
const publicKey = process.env.JWT_PUBLIC_KEY

const uniqid = require('uniqid');

// const {sendNotification} = require('../modules/sendNotification')


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






router.post('/new-emergency/:emergencyData', async (req, res) => {

    try {
        await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })

        const decryptedData = jwt.verify(req.params.emergencyData, publicKey)

        const { user_firstname, user_name, user_email, user_phone, connected, media_link, media_type, emergency_reason, mediaExtension, mediaMimeType, user_location } = decryptedData

        // Upload à Firebase si média présent

        let media_url = ""
        let media_name = ""

        if (media_link) {
            media_name = `${uniqid()}.${mediaExtension}`

            const emergencyMediaRef = ref(storage, `emergenciesMedias/${media_name}`)

            const metadata = {
                contentType: mediaMimeType,
            }

            const uploadedMedia = await uploadBytes(emergencyMediaRef, req.files.emergencyMedia.data, metadata);

            media_url = await getDownloadURL(uploadedMedia.ref)
        }


        // Enregistrement en bdd de la demande
        const createdAt = new Date()

        const newEmergency = new Emergency({
            user_firstname, user_name, user_email, user_phone, connected, media_url, media_type, media_name, emergency_reason, createdAt, user_location, located: user_location.length > 0 ? true : false
        })

        const savedEmergency = await newEmergency.save()


        // Si l'utilisateur était connecté, inscription en clef étrangère de sa demande de contact

        if (connected) {
            const user = await User.findOne({ email: user_email })

            user.emergency = savedEmergency._id
            await user.save()
        }

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

        // Suppression de la clef étrangère d'un document utilisateur si celui existe
        const update = await User.updateOne({ emergency: _id }, { $unset: { emergency: _id } })

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

        if (!emergencies){
            emergencies = []
        }

        res.json({ result: true, emergencies })

    } catch (err) {
        console.log(err)
        res.json({ result: false, err })
    }
})





module.exports = router;