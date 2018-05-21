const mongoose = require('mongoose')

let schema = mongoose.Schema({
    champion: {type: String, required: true},
    winner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    date: {type: Date, required: true, default: Date.now()}
})

module.exports = mongoose.model('Result', schema)