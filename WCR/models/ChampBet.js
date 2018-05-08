const mongoose = require('mongoose');

let schema = mongoose.Schema({
    champion: {type: String, required: true},
    author: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    date: {type: Date, default: Date.now()}
});

const ChampBet = mongoose.model('ChampBet', schema);

module.exports = ChampBet;