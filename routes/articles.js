var express = require('express');
var router = express.Router();

const Article = require('../models/articles')

const jwt = require('jsonwebtoken')
const secretKey = process.env.JWT_SECRET_KEY
const publicKey = process.env.JWT_PUBLIC_KEY

const uniqid = require('uniqid');

const User = require('../models/users')

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






// Route pour obtenir tous les articles

router.get('/getArticles', async (req, res) => {
    try {

        if ( mongoose.connection.readyState !== 1 ){
            console.log("NO DB CONNEXION")
            await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })
        }

        const articles = await Article.find()

        if (articles) {
            res.json({ result: true, articles })
        }
        else {
            res.json({ result: false, error: "Pas d'articles" })
        }

    } catch (err) {
        console.log("err :", err)
        res.json({ err })
    }
})






// Route pour poster ou modifier un article

router.post('/save-article/:postData', async (req, res) => {
    try {

        if ( mongoose.connection.readyState !== 1 ){
            console.log("NO DB CONNEXION")
            await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })
        }

        const decryptedData = jwt.verify(req.params.postData, publicKey)

        const { _id, jwtToken, createdAt, pictureExtension, pictureMimeType, articleData } = decryptedData


        const decryptedToken = jwt.verify(jwtToken, secretKey)
        let user = await User.findOne({ token: decryptedToken.token })

        // Vérification que l'utilisateur postant est bien admin
        if (!user || !user.is_admin) { return res.json({ result: false, error: 'Utilisateur non trouvé ou non autorisé. Essayez en vous reconnectant.' }) }



        // Si une image du portable de l'utilisateur est envoyée, enregistrement de celle ci dans firebase

        if (pictureMimeType) {
            const img_name = `${uniqid()}.${pictureExtension}`
            const pictureRef = ref(storage, `articlePictures/${img_name}`)

            const metadata = {
                contentType: pictureMimeType,
            }

            const uploadedMedia = await uploadBytes(pictureRef, req.files.articlePicture.data, metadata);

            const firebasePictureUrl = await getDownloadURL(uploadedMedia.ref)

            articleData.img_link = firebasePictureUrl
            articleData.img_name = img_name
        }else{
            articleData.img_name = ""
        }


        // Si l'article existe déjà, modification de celui ci 
        if (_id !== "testArticleId") {
            let article = await Article.findOne({ _id })


            // Blocage du changement s'il s'agit de passer un article de home dans une autre catégorie ou vice versa
            if (articleData.category == "home" && article.category !== "home") {
                return res.json({ result: false, error: "Erreur : Pour changer l'article de l'accueil, merci de modifier celui ci ou d'en écrire un nouveau" })
            }
            if (articleData.category !== "home" && article.category == "home") {
                return res.json({ result: false, error: "Erreur : Impossible de changer la catégorie de l'article de la page d'accueil" })
            }


            // Si nouvelle image et ancienne sur firebase, suppression de cette dernière

            if (article.img_link !== articleData.img_link && article.img_link.includes('firebase')) {
                const pictureRef = ref(storage, `articlePictures/${article.img_name}`)

                const mediaSupress = await deleteObject(pictureRef)
            }


            // Modification et enregistrement de l'article
            for (let attribute in articleData) {
                article[attribute] = articleData[attribute]
            }

            const articleModified = await article.save()

            res.json({ result: true, articleModified })

        }
        else {
            // Si l'article n'existe pas en BDD, enregistrement de celui ci

            // Rajout de la date
            articleData.createdAt = createdAt


            const newArticle = new Article(articleData)

            const articleSaved = await newArticle.save()


            res.json({ result: true, articleSaved })


        }

    } catch (err) {
        console.log(err)
        res.json({ result: false, err })
    }
})





// Router pour supprimer un article de la bdd et son image du cloud

router.delete('/delete-article/:jwtToken/:_id', async (req, res) => {
    try {

        if ( mongoose.connection.readyState !== 1 ){
            console.log("NO DB CONNEXION")
            await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })
        }


        const { jwtToken, _id } = req.params

        const decryptedToken = jwt.verify(jwtToken, secretKey)
        let user = await User.findOne({ token: decryptedToken.token })

        // Vérification que l'utilisateur postant est bien admin
        if (!user || !user.is_admin) { return res.json({ result: false, error: 'Utilisateur non trouvé, essayez en vous reconnectant.' }) }

        const article = await Article.findOne({ _id })
        const img_name = article.img_link.includes("firebase") ? article.img_name : ""

        const deleteResult = await Article.deleteOne({ _id })

        if (deleteResult.deletedCount !== 1) {
            res.json({ result: false, error: "Problème de connexion à la base de donnée, merci de contacter le webmaster." })

            return
        }
        else {
            // Supression de l'article dans les favoris des utilisateurs
            await User.updateMany({ bookmarks: _id }, { $pull: { bookmarks: _id } })

            // Supression de l'image de firebase s'il y en avait une d'enregistrée
            if(img_name){
                const pictureRef = ref(storage, `articlePictures/${img_name}`)

                const mediaSupress = await deleteObject(pictureRef)
            }

            res.json({ result: true })
        }

    } catch (err) {
        console.log(err)
        res.json({ result: false, err })
    }
})


module.exports = router;