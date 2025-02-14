var express = require('express');
var router = express.Router();

const Article = require('../models/articles')

const jwt = require('jsonwebtoken')
const secretKey = process.env.JWT_SECRET_KEY
const User = require('../models/users')

const mongoose = require('mongoose')
const connectionString = process.env.CONNECTION_STRING




// Route pour obtenir tous les articles

router.get('/getArticles', async (req, res) => {
    try {

        await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })

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

router.post('/save-article', async (req, res) => {
    try {

        await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })


        const { _id, jwtToken, createdAt, articleData } = req.body

        
        const decryptedToken = jwt.verify(jwtToken, secretKey)
        let user = await User.findOne({ token: decryptedToken.token })

        // Vérification que l'utilisateur postant est bien admin
        if (!user || !user.is_admin) { return res.json({ result: false, error: 'Utilisateur non trouvé ou non autorisé. Essayez en vous reconnectant.' }) }



        // Si l'article existe déjà, modification de celui ci 
        if (_id !== "testArticleId") {
            let article = await Article.findOne({ _id })


            // Blocage du changement s'il s'agit de passer un article de home dans une catégorie ou vice versa
            if (articleData.category == "home" && article.category !== "home") {
                return res.json({ result: false, error: "Erreur : Pour changer l'article de l'accueil, merci de modifier celui ci ou d'en écrire un nouveau" })
            }
            if (articleData.category !== "home" && article.category == "home") {
                return res.json({ result: false, error: "Erreur : Impossible de changer la catégorie de l'article de la page d'accueil" })
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



module.exports = router;