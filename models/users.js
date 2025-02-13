const mongoose =require('mongoose')

const userSchema = mongoose.Schema({
    firstname : String,
    name : String,
    email : String,
    password : String,
    inscription_date :Date,
    is_admin : {type : Boolean, default : true},
    phone : String,
    token : String,
    push_token : String,
    bookmarks : [{ type: mongoose.Schema.Types.ObjectId, ref: 'articles' }],
    emergency : { type: mongoose.Schema.Types.ObjectId, ref: 'emergencies' }
})

const User = mongoose.model('users', userSchema)

module.exports = User