const mongoose = require('mongoose');

let schema = mongoose.Schema({
    team1: {type: String, required: true},
    team2: {type: String, required: true},
    team3: {type: String, required: true},
    team4: {type: String, required: true},
    position1: {type: Number},
    position2: {type: Number},
    position3: {type: Number},
    position4: {type: Number},
    name: {type: String, required: true},
    bets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GrBet'
    }],
    date: {type: Date, required: true, default: Date.now()}
});

const Group = mongoose.model('Group', schema);

module.exports = Group;