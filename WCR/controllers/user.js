const User = require('mongoose').model('User')
const Bet = require('mongoose').model('Bet')
const GrBet = require('mongoose').model('GrBet')
const ChampBet = require('mongoose').model('ChampBet')
const Result = require('mongoose').model('Result')
const encryption = require('./../utilities/encryption')
const gameController = require('./game')

module.exports = {
    registerGet: (req, res) => {
        res.render('user/register');
    },

    registerPost:(req, res) => {
        let registerArgs = req.body;
        // console.log(registerArgs);

        User.findOne({userName: registerArgs.userName}).then(user => {
            let errorMsg = '';
            if (user) {
                errorMsg = 'Съществуващ потребител!';
            } else if (registerArgs.password !== registerArgs.repeatedPassword) {
                errorMsg = 'Грешно потвърждение на парола!'
            }

            if (errorMsg) {
                registerArgs.error = errorMsg;
                res.render('user/register', registerArgs)
            } else {
                let salt = encryption.generateSalt();
                let passwordHash = encryption.hashPassword(registerArgs.password, salt);

                let userObject = {
                    userName: registerArgs.userName,
                    passwordHash: passwordHash,
                    name: registerArgs.name,
                    salt: salt,
                    admin: false
                };

                User.create(userObject).then(user => {
                    req.logIn(user, (err) => {
                        if (err) {
                            registerArgs.error = err.message;
                            res.render('user/register', registerArgs);
                            return;
                        }

                        res.redirect('/')
                    })
                })
            }
        })
    },

    loginGet: (req, res) => {
        res.render('user/login');
    },

    loginPost: (req, res) => {
        let loginArgs = req.body;
        // console.log(loginArgs);
        User.findOne({userName: loginArgs.userName}).then(user => {
            if (!user ||!user.authenticate(loginArgs.password)) {
                let errorMsg = 'Грешен потребител или парола!';
                loginArgs.error = errorMsg;
                res.render('user/login', loginArgs);
                return;
            }

            req.logIn(user, (err) => {
                if (err) {
                    // console.log(err);
                    res.render('user/login', {error: err.message});
                    return;
                }

                res.redirect('/');
            })
        })
    },

    logout: (req, res) => {
        req.logOut();
        res.redirect('/');
    },

    details: (req, res) => {
        let id = req.params.id
        let view = 'user/details'

        User.findById(id).then(user => {
            Bet.find({author: user._id}).populate('match').then(matchbets => {
                GrBet.find({author: user._id}).populate('group').then(grbets => {
                    ChampBet.findOne({author: user._id}).then(champbet => {
                        Result.findOne({}).populate('winner').then(final => {
                            let info = {
                                name: user.name,
                                userName: user.userName,
                                betsCount: 0,
                                pointsMatch: 0,
                                pointsGroup: 0,
                                pointsChamp: 0,
                                pointsAll: 0
                            }

                            if (champbet !== null) {
                                info.betsCount++
                                if (final.champion === champbet.champion) {
                                    info.pointsChamp += 10
                                    info.pointsAll += 10
                                }
                            }

                            for (let bet of matchbets) {
                                info.betsCount++
                                let points = Number(gameController.calcMatchPoints(bet.match, bet))
                                info.pointsMatch += points
                                info.pointsAll += points
                            }

                            for (let bet of grbets) {
                                info.betsCount++
                                let gr = gameController.calcGroupPoints(bet.group, bet)
                                let grPoints = Number(gr.position1) + Number(gr.position2) + Number(gr.position3) + Number(gr.position4)
                                info.pointsGroup += grPoints
                                info.pointsAll += grPoints
                            }

                            res.render(view, {info: info})
                        })
                    })
                })
            })
        }).catch(err => {
            res.render(view, {error: 'Не е открит участник!'})
        })
    }
}
