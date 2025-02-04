const mongoose = require('mongoose')

const articleSchema = mongoose.Schema({
    title : String,
    sub_category : String,
    img_link : String,
    img_margin_top : Number,
    img_margin_left : Number,
    img_zoom : Number,
    img_ratio : Number,
    video_id : String,
    category : String,
    text1 : String,
    text2 : String,
    createdAt : Date,
    author : String,
    tags : Array,
    media_link : String,
})

const Article = mongoose.model('articles', articleSchema)
module.exports = Article