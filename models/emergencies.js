const mongoose = require('mongoose')

const emergencySchema = mongoose.Schema({
    user_firstname : String,
    user_name : String,
    user_email : String,
    user_phone : String,
    media_url : String,
    media_name : String,
    media_type : String,
    connected : Boolean,
    located : Boolean,
    emergency_reason : String,
    createdAt : Date,
    user_location : Array,
})

const Emergency = mongoose.model('emergencies', emergencySchema)
module.exports = Emergency