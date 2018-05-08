const mongoose = require('mongoose');

let betSchema = mongoose.Schema({
    goal1: {type: Number},
    goal2: {type: Number},
    group: {type: Number, required: true},
    match: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Match'},
    author: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    date: {type: Date, default: Date.now()}
});

const Bet = mongoose.model('Bet', betSchema);

module.exports = Bet;