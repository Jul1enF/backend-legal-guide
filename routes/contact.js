var express = require('express');
var router = express.Router();

const { sendContactMail } = require('../modules/sendMail')


router.put('/sendMessage', async (req, res)=>{
    try {
        const {names, email, phone, subject, message}=req.body

        await sendContactMail(names, email, phone, subject, message, "alexis@baudelinavocat.fr")

        res.json({result : true})

    }catch(err){
        console.log("ERR", err)
        res.json({result : false})
    }
})



module.exports = router;