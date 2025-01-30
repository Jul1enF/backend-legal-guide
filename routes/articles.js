var express = require('express');
var router = express.Router();

const Article = require('../models/articles')

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



module.exports = router;