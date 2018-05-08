const mongoose = require('mongoose');

let matchSchema = mongoose.Schema({
    team1: {type: String, required: true},
    team2: {type: String, required: true},
    goal1: {type: Number},
    goal2: {type: Number},
    group: {type: Number, required: true},
    // result: {type: String},
    bets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bet'
    }],
    isSeparator: {type: Boolean, default: false},
    date: {type: Date, required: true, default: Date.now()}
});

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;