const Match = require('mongoose').model('Match')
const Bet = require('mongoose').model('Bet')
const User = require('mongoose').model('User')
const Group = require('mongoose').model('Group')
const GrBet = require('mongoose').model('GrBet')
const ChampBet = require('mongoose').model('ChampBet')
const Result = require('mongoose').model('Result')

let wDate = new Date(2018, 6 - 1, 14, 18, 0, 0, 0)
let worldChampObj = {
    champion: 'няма',
    date: dtf(wDate)
}

function dt(num) {
    return Number(num) < 10 ? '0' + num : num
}

function dtf(date) {
    return dt(date.getDate())  + "." + dt(date.getMonth()+1) + " " + dt(date.getHours()) + ":" + dt(date.getMinutes())
}

let calcPoints = function (match, bet) {
    if (match.goal1 === undefined) {
        return ''
    } else if (match.goal1 === bet.goal1 && match.goal2 === bet.goal2) {
        return 3
    } else if (match.goal1 > match.goal2 && bet.goal1 > bet.goal2) {
        return 1
    } else if (match.goal1 < match.goal2 && bet.goal1 < bet.goal2) {
        return 1
    } else if (match.goal1 === match.goal2 && bet.goal1 === bet.goal2) {
        return 1
    } else {
        return 0
    }
}

let calcGroupPoints = function (group, bet) {
    let calcPoints = function (position, betValue) {
        if (position == 1 && betValue == 1) {
            return 4
        } else if (position == 2 && betValue == 2) {
            return 3
        } else if (position == 3 && betValue == 3) {
            return 2
        } else if (position == 4 && betValue == 4) {
            return 1
        } else {
            return 0
        }
    }

    let result = {
        position1: calcPoints(group.position1, bet.position1),
        position2: calcPoints(group.position2, bet.position2),
        position3: calcPoints(group.position3, bet.position3),
        position4: calcPoints(group.position4, bet.position4)
    }
    // console.log(result);
    return result
}

let getClassName = function (points) {
    if (points === '') {
        return ''
    } else if (points == 1) {
        return ' match'
    } else if (points == 3) {
        return ' totalmatch'
    } else {
        return ' nomatch'
    }
}

let getGroupClassName = function (points) {
    let result = {
        position1: points.position1 > 0 ? ' totalmatch' : ' nomatch',
        position2: points.position2 > 0 ? ' totalmatch' : ' nomatch',
        position3: points.position3 > 0 ? ' totalmatch' : ' nomatch',
        position4: points.position4 > 0 ? ' totalmatch' : ' nomatch'
    }
    return result
}

let getGroupResults = function (id, users, matches, bets, totalArr) {
    let resultsArr = []
    let bonusArr = []
    let roundArr = []
    for (let match of matches.filter(x => x.group === id)) {
        let i = 0
        for (let user of users) {
            let points = 0
            for (let bet of bets) {
                if (bet.author.userName === user.userName && bet.match.id === match.id) {
                    points = calcPoints(match, bet)
                    break
                }
            }
            if (resultsArr[i] === undefined) {resultsArr[i] = 0}
            resultsArr[i] += Number(points)

            i++
        }
    }

    let max = Math.max(...resultsArr)
    for (let i = 0; i < resultsArr.length; i++) {
        bonusArr[i] = resultsArr[i] === max ? 5 : '';
        roundArr[i] = resultsArr[i] === max ? resultsArr[i] + 5 : resultsArr[i];
        totalArr[i] = totalArr[i] === undefined ? roundArr[i] : totalArr[i] + roundArr[i]
    }

    return totalArr
}

let title = {
    1: 'Първи кръг',
    2: 'Втори кръг',
    3: 'Трети кръг',
    4: 'Финален кръг'
}

function getRound(req, id, users, matches, bets, prevPoints) {
    let currentUser = req.isAuthenticated() ? req.user.userName : ''
    let admin = req.isAuthenticated() && req.user.admin ? true : false

    let matchesArr = []
    let resultsArr = []
    let bonusArr = []
    let roundArr = prevPoints
    for (let match of matches.filter(x => x.group === id)) {

        let matchObj = {
            team1: match.team1,
            team2: match.team2,
            result: match.goal1 === undefined ? 'няма' : match.goal1 + ' : ' + match.goal2,
            date: dtf(match.date),
            bets: [],
            span: users.length + 3
        }
        if (admin) {
            matchObj.href = match.id
        }
        if (match.isSeparator !== undefined && match.isSeparator) {
            matchObj.isSeparator = true
        }

        let i = 0
        for (let user of users) {

            let isCurrent = (user.userName === currentUser) && (match.date > new Date(Date.now()))
            let betObj = {current: isCurrent}
            let foundBet = false
            for (let bet of bets) {
                if (bet.author.userName === user.userName && bet.match.id === match.id) {
                    // console.log('Found bet:');
                    // console.log(bet);
                    betObj.result = bet.goal1 + ' : ' + bet.goal2
                    betObj.href = 'bet/' + bet.id
                    betObj.points = calcPoints(match, bet)
                    betObj.className = getClassName(betObj.points)

                    if ((user.userName !== currentUser) && (match.date > new Date(Date.now())) && !admin)
                        betObj.hidden = true

                    foundBet = true
                    break
                }
            }
            if (!foundBet) {
                betObj.href = 'newbet/' + match.id
                betObj.points = 0
                betObj.result = 'няма'
            }
            matchObj.bets.push(betObj)

            if (resultsArr[i] === undefined) {resultsArr[i] = 0}
            resultsArr[i] += Number(betObj.points)

            i++
        }

        // console.log('Match object: ');
        // console.log(matchObj);

        matchesArr.push(matchObj)
    }

    let max = Math.max(...resultsArr)

    // calculates round points plus round bonus points
    for (let i = 0; i < resultsArr.length; i++) {
        bonusArr[i] = resultsArr[i] === max ? 5 : '';
        roundArr[i] += resultsArr[i] === max ? resultsArr[i] + 5 : resultsArr[i];
    }

    // adds previous round points
    for (let i = 1; i < id; i++) {
        roundArr = getGroupResults(i, users, matches, bets, roundArr);
    }

    let result = {
        users: users,
        matches: matchesArr,
        total: {round: resultsArr, bonus: bonusArr, total: roundArr},
        title: title[id]
    }

    return result

}

function getGroups(req, users, groups, bets, champbets, final) {
    let currentUser = req.isAuthenticated() ? req.user.userName : ''
    let admin = req.isAuthenticated() && req.user.admin ? true : false

    let groupsArr = []
    let resultsArr = []
    let bonusArr = []
    let roundArr = []

    for (let i = 0; i < users.length; i++) {
        resultsArr[i] = 0
    }

    for (let group of groups) {

        let groupObj = {
            activeBet: req.isAuthenticated() && (group.date > new Date(Date.now())),
            team1: group.team1,
            team2: group.team2,
            team3: group.team3,
            team4: group.team4,
            position1: group.position1 === undefined ? 'няма' : group.position1,
            position2: group.position2 === undefined ? 'няма' : group.position2,
            position3: group.position3 === undefined ? 'няма' : group.position3,
            position4: group.position4 === undefined ? 'няма' : group.position4,
            date: dtf(group.date),
            bets: [],
            span: users.length + 3,
            href: 'groups/newBet/' + group.id,
            name: group.name
        }
        if (admin) {
            groupObj.edithref = 'groups/edit/' + group.id
        }

        let i = 0
        for (let user of users) {
            let betObj = {
                position1: 'няма',
                position2: 'няма',
                position3: 'няма',
                position4: 'няма',
                points: {position1: 0, position2: 0, position3: 0, position4: 0},
                className: {position1: '', position2: '', position3: '', position4: ''}
            }

            for (let bet of bets) {
                if (bet.author.userName === user.userName && bet.group.id === group.id) {
                    betObj.position1 = bet.position1
                    betObj.position2 = bet.position2
                    betObj.position3 = bet.position3
                    betObj.position4 = bet.position4
                    if (user.userName === currentUser)
                        groupObj.href = 'groups/editBet/' + bet.id
                    else if (group.date > new Date(Date.now()) && !admin)
                        betObj.hidden = true
                    betObj.points = calcGroupPoints(group, bet)
                    betObj.className = getGroupClassName(betObj.points)
                    // ff.bets.push(betObj)
                    break
                }
            }

            groupObj.bets.push(betObj)

            // if (resultsArr[i] === undefined) {resultsArr[i] = 0}
            resultsArr[i] += betObj.points.position1 + betObj.points.position2 + betObj.points.position3 + betObj.points.position4

            i++
        }

        // console.log('groupObj:')
        // console.log(groupObj);

        groupsArr.push(groupObj)
    }

    let champArr = []
    for (let user of users) {
        let isCurrent = (user.userName === currentUser) && (final.date > new Date(Date.now()))
        let champObj = {
            champion: 'няма',
            href: 'groups/champBet',
            points: 0,
            current: isCurrent
        }
        for (let champbet of champbets) {
            if (champbet.author.userName === user.userName) {
                champObj.champion = champbet.champion
                champObj.href += '/' + champbet.id

                if (final.champion !== 'няма' && final.champion === champbet.champion) {
                    champObj.points = 10
                    champObj.className = ' totalmatch'
                } else {
                    champObj.className = ' nomatch'
                }

                if ((user.userName !== currentUser) && (final.date > new Date(Date.now())) && !admin)
                    champObj.hidden = true

                break
            }
        }
        champArr.push(champObj)
    }

    // console.log('groupsArr:')
    // console.log(groupsArr)

    let max = Math.max(...resultsArr)

    // calculates round points plus round bonus points
    for (let i = 0; i < resultsArr.length; i++) {
        bonusArr[i] = resultsArr[i] === max ? 5 : ''
        roundArr[i] = (resultsArr[i] === max ? resultsArr[i] + 5 : resultsArr[i]) + champArr[i].points
    }

    // adds previous round points
    // for (let i = 1; i < 4; i++) {
    //     roundArr = getGroupResults(i, users, matches, mbets, roundArr);
    // }

    let champ = {
        champion: final.champion,
        date: dtf(final.date),
        winner: final.winner !== undefined ? final.winner.name : 'няма'
    }
    // console.log(champ);
    return {
        users: users,
        groups: groupsArr,
        champs: champArr,
        champRez: champ,
        total: {round: resultsArr, bonus: bonusArr, total: roundArr},
        columns: users.length + 3
    }
}

module.exports = {

    groupGet: (req, res) => {
        User.find({}).then(users => {
            Group.find({}).then(groups => {
                GrBet.find({}).populate('group').populate('author').then(bets => {
                    ChampBet.find({}).populate('author').then(champbets => {
                        Result.findOne({}).populate('winner').then(final => {
                            let result = getGroups(req, users, groups, bets, champbets, final)
                            res.render('home/group', result)
                        }).catch(err => {
                            res.render('home/error', {error: 'Неуспешно прочитане на резултатите!'})
                        })
                    })
                })
            })
        })
    },

    roundGet: (req, res) => {
        let id = Number(req.params.id)

        User.find({}).populate('bets').then(users => {
            Match.find({}).where('group').lt(id + 1).sort({date: 1}).then(matches => {
                matches.push({
                    team1: 'предстоящи мачове',
                    isSeparator: true,
                    date: new Date(Date.now()),
                    group: id
                })
                matches.sort(function(a,b) {return (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0);} )
                // matches = matches.sort({date: -1})
                Bet.find({}).where('group').lt(id + 1).populate('match').populate('author').then(bets => {
                    Group.find({}).then(groups => {
                        GrBet.find({}).populate('group').populate('author').then(grbets => {
                            ChampBet.find({}).populate('author').then(champbets => {
                                Result.findOne({}).populate('winner').then(final => {
                                    let groupResult = getGroups(req, users, groups, grbets, champbets, final)
                                    let result = getRound(req, id, users, matches, bets, groupResult.total.total)
                                    result.champRez = groupResult.champRez

                                    let last = result.matches.pop()
                                    if (last.team1 !== 'предстоящи мачове')
                                        result.matches.push(last)

                                    res.render('home/index', result)
                                }).catch(err => {
                                    res.render('home/error', {error: 'Неуспешно прочитане на резултатите!'})
                                })
                            })
                        })
                    })
                })
            })
        })

    },

    newGroupGet: (req, res) => {
        let date = new Date(Date.now())
        let dt = {
            day: date.getDate(),
            month: date.getMonth() + 1,
            hour: date.getHours(),
            minute: date.getMinutes()
        }
        res.render('groups/create', {dt: dt})
    },

    newGroupPost: (req, res) => {
        let args = req.body;
        console.log(args);
        let groupArgs = {
            team1: args.team1,
            team2: args.team2,
            team3: args.team3,
            team4: args.team4,
            date: new Date(2018, Number(args.month) - 1, args.day, args.hour, args.minutes, 0, 0),
            name: args.group
        }

        if(!req.isAuthenticated() || !req.user.admin) {
            res.render('game/create', {error: 'Трябва да сте администратор за да добавяте мачове!'});
            return
        }

        console.log(groupArgs);

        Group.create(groupArgs).then(group => {
            res.redirect('/');
        })
    },

    newMatchGet: (req, res) => {
        let date = new Date(Date.now())
        let dt = {
            day: date.getDate(),
            month: date.getMonth() + 1,
            hour: date.getHours(),
            minute: date.getMinutes()
        }
        res.render('game/create', {dt: dt})
    },

    newMatchPost: (req, res) => {
        let args = req.body;
        let matchArgs = {
            team1: args.team1,
            team2: args.team2,
            date: new Date(2018, Number(args.month) - 1, args.day, args.hour, args.minutes, 0, 0),
            group: args.group
        }

        if(!req.isAuthenticated() || !req.user.admin) {
            res.render('game/create', {error: 'Трябва да сте администратор за да добавяте мачове!'});
            return
        }

        // if(errorMsg) {
        //     res.render('article/create', {error: errorMsg});
        //     return;
        // }

        // console.log(req.user.id);

        Match.create(matchArgs).then(match => {
            res.redirect('/rounds/' + args.group);
        })
    },

    matchEditGet: (req, res) => {
        let backURL = req.header('Referer')
        let id = req.params.id
        Match.findById(id).then(match => {
            // console.log(bet);
            let date = match.date
            let dt = {
                day: date.getDate(),
                month: date.getMonth() + 1,
                hour: date.getHours(),
                minute: date.getMinutes()
            }
            res.render('game/matchedit', {match: match, href: backURL, dt: dt})
        })

        // res.render('game/create', {dt: dt})
    },

    matchEditPost: (req, res) => {
        let id = req.params.id
        let args = req.body;
        // console.log(args);
        // console.log(id);
        Match.findById(id).then(match => {
            // console.log(match);

            let errorMsg = '';
            if(!req.isAuthenticated() || !req.user.admin) {
                errorMsg = 'Трябва да сте администратор за да променяте мач!';
            }

            if(errorMsg) {
                res.render('game/matchedit', {error: errorMsg});
                return;
            }

            match.team1 = args.team1
            match.team2 = args.team2
            match.date = new Date(2018, Number(args.month) - 1, args.day, args.hour, args.minutes, 0, 0)
            match.group = args.group

            // let matchArgs = {
            //     team1: args.team1,
            //     team2: args.team2,
            //     date: new Date(2018, Number(args.month) - 1, args.day, args.hour, args.minutes, 0, 0),
            //     group: args.group
            // }

            // match.goal1 = Number(args.goal1)
            // match.goal2 = Number(args.goal2)
            match.save(err => {
                if (err) {
                    res.render('game/matchedit', {error: err.message});
                } else {
                    res.redirect('/rounds/' + match.group);
                }
            });
        })
    },

    betGet: (req, res) => {
        let backURL = req.header('Referer')
        let id = req.params.id
        // console.log(id);
        Bet.findById(id).populate('match').then(bet => {
            // console.log(bet);
            res.render('game/bet', {bet: bet, href: backURL})
        })
    },

    betPost: (req, res) => {
        let id = req.params.id
        let betArgs = req.body;
        // console.log(betArgs);
        // console.log(id);
        Bet.findById(id).populate('author').populate('match').then(bet => {
            // console.log(bet);

            let errorMsg = '';
            if(!req.isAuthenticated()) {
                errorMsg = 'Трябва да сте влезнали в профила си!';
            } else if(req.user.userName !== bet.author.userName) {
                errorMsg = 'Не сте автор на прогнозата!';
            } else if(bet.match.date < new Date(Date.now())) {
                errorMsg = 'Времето за прогноза е изтекло!';
            }

            if(errorMsg) {
                res.render('game/bet', {error: errorMsg});
                return;
            }

            bet.goal1 = Number(betArgs.goal1)
            bet.goal2 = Number(betArgs.goal2)
            bet.save(err => {
                if (err) {
                    res.render('game/bet', {error: err.message});
                } else {
                    res.redirect('/rounds/' + bet.group);
                }
            });
        })
    },

    newbetGet: (req, res) => {
        let backURL = req.header('Referer')
        // console.log(backURL);
        let id = req.params.id
        // console.log(id);
        Match.findById(id).then(match => {
            // console.log(bet);
            res.render('game/newbet', {match: match, href: backURL})
        })
    },

    newbetPost: (req, res) => {
        let id = req.params.id
        let args = req.body;
        // console.log(args);
        // console.log(id);
        Match.findById(id).then(match => {
            // console.log(match);

            // if(!req.isAuthenticated()) {
            //     res.render('game/bet', {error: 'Трябва да сте влезнали в профила си!'});
            //     return;
            // }

            let errorMsg = '';
            if(!req.isAuthenticated()) {
                errorMsg = 'Трябва да сте влезнали в профила си!';
            } else if(match.date < new Date(Date.now())) {
                errorMsg = 'Времето за прогноза е изтекло!';
            }

            if(errorMsg) {
                res.render('game/newbet', {error: errorMsg});
                // res.redirect('/', {error: errorMsg});
                return;
            }

            let betArgs = {goal1: args.goal1, goal2: args.goal2, match: match.id, author: req.user.id, group: match.group}
            Bet.create(betArgs).then(bet => {
                match.bets.push(bet.id);
                match.save(err => {
                    if (err) {
                        res.render('game/newbet', {error: err.message});
                    } else {
                        req.user.bets.push(bet.id);
                        req.user.save(err => {
                            if (err) {
                                res.render('game/newbet', {error: err.message});
                            } else {
                                res.redirect('/rounds/' + bet.group);
                            }
                        });
                    }
                });
            })
        })
    },

    matchResultGet: (req, res) => {
        let backURL = req.header('Referer')
        let id = req.params.id
        // console.log(id);
        Match.findById(id).then(match => {
            // console.log(bet);
            res.render('game/matchresult', {match: match, href: backURL})
        })
    },

    matchResultPost: (req, res) => {
        let id = req.params.id
        let args = req.body;
        // console.log(args);
        // console.log(id);
        Match.findById(id).then(match => {
            // console.log(match);

            let errorMsg = '';
            if(!req.isAuthenticated() || !req.user.admin) {
                errorMsg = 'Трябва да сте администратор за да променяте резултат!';
            }

            if(errorMsg) {
                res.render('game/matchresult', {error: errorMsg});
                return;
            }

            match.goal1 = Number(args.goal1)
            match.goal2 = Number(args.goal2)
            match.save(err => {
                if (err) {
                    res.render('game/matchresult', {error: err.message});
                } else {
                    res.redirect('/rounds/' + match.group);
                }
            });
        })
    },

    matchDeleteGet: (req, res) => {
        let id = req.params.id
        // console.log(id);
        Match.findById(id).then(match => {
            // console.log(bet);

            let errorMsg = '';
            if(!req.isAuthenticated() || !req.user.admin) {
                errorMsg = 'Трябва да сте администратор за да изтривате мач!';
            }

            if(errorMsg) {
                res.render('game/matchedit', {error: errorMsg});
                return;
            }

            var str = "{_id :"+"ObjectId(" + "\"" + req.body + "\"" + ")" + "}";
            console.log(str);
            match.remove(err => {
                if (err) {
                    res.render('game/matchedit', {error: err.message});
                } else {
                    res.redirect('/rounds/' + match.group);
                }
            });

            // res.redirect('/rounds/' + match.group);
            // res.render('game/matchresult', {match: match, href: backURL})
        })
    },

    createGroupBetGet: (req, res) => {
        let backURL = req.header('Referer')
        // console.log(backURL);
        let id = req.params.id
        // console.log(id);
        // Match.findById(id).then(match => {
            // console.log(bet);
            res.render('game/groupbet', {href: backURL})
        // })
    },

    groupEditGet: (req, res) => {
        let backURL = req.header('Referer')
        let id = req.params.id
        Group.findById(id).then(group => {
            let date = group.date
            let dt = {
                day: date.getDate(),
                month: date.getMonth() + 1,
                hour: date.getHours(),
                minute: date.getMinutes()
            }
            res.render('groups/edit', {group: group, href: backURL, dt: dt})
        })
    },

    groupEditPost: (req, res) => {
        let id = req.params.id
        let args = req.body;
        console.log(args);

        let [p1, p2, p3, p4] = [args.position1, args.position2, args.position3, args.position4]

        // console.log(id);
        Group.findById(id).then(group => {

            let errorMsg = '';
            if (
                (p1 !== '' && (p1 === p2 || p1 === p3 || p1 === p4)) ||
                (p2 !== '' && (p2 === p3 || p2 === p4)) ||
                (p3 !== '' && (p3 === p4))
            ) {
                errorMsg = 'Не може да има дублиращи позиции!'
                // res.render('groups/edit', {group: group, dt: dt, error: 'Не може да има дублиращи позиции!'})
            } else if(!req.isAuthenticated() || !req.user.admin) {
                errorMsg = 'Трябва да сте администратор за да променяте група!'
            }

            if(errorMsg) {
                let dt = {
                    day: args.day,
                    month: args.month,
                    hour: args.hour,
                    minute: args.minutes
                }
                res.render('groups/edit', {group: group, dt: dt, error: errorMsg})
                // res.redirect('/', {error: errorMsg});
                return;
            }

            group.position1 = (p1 !== '') ? p1 : undefined
            group.position2 = (p2 !== '') ? p2 : undefined
            group.position3 = (p3 !== '') ? p3 : undefined
            group.position4 = (p4 !== '') ? p4 : undefined
            group.date = new Date(2018, Number(args.month) - 1, args.day, args.hour, args.minutes, 0, 0)
            group.name = args.group

            group.save(err => {
                if (err) {
                    res.render('groups/edit', {error: err.message});
                } else {
                    res.redirect('/');
                }
            });
        })
    },

    groupNewBetGet: (req, res) => {
        let id = req.params.id
        Group.findById(id).then(group => {
            res.render('groups/newBet', {group: group})
        })
    },

    groupNewBetPost: (req, res) => {
        let id = req.params.id
        let args = req.body;
        Group.findById(id).then(group => {
            let errorMsg = ''
            let [p1, p2, p3, p4] = [args.position1, args.position2, args.position3, args.position4]
            if(!req.isAuthenticated()) {
                errorMsg = 'Трябва да сте влезнали в профила си!'
            } else if(group.date < new Date(Date.now())) {
                errorMsg = 'Времето за прогноза е изтекло!'
            } else if (
                (p1 !== '' && (p1 === p2 || p1 === p3 || p1 === p4)) ||
                (p2 !== '' && (p2 === p3 || p2 === p4)) ||
                (p3 !== '' && (p3 === p4))) {
                errorMsg = 'Не може да има дублиращи позиции!'
            }

            if(errorMsg) {
                res.render('groups/newBet', {error: errorMsg, group: group})
                return
            }

            let betArgs = {
                position1: p1,
                position2: p2,
                position3: p3,
                position4: p4,
                group: group.id,
                author: req.user.id
            }

            GrBet.create(betArgs).then(bet => {
                group.bets.push(bet.id);
                group.save(err => {
                    if (err) {
                        res.render('groups/newBet', {error: errorMsg, group: group})
                    } else {
                        res.redirect('/');
                        // req.user.bets.push(bet.id);
                        // req.user.save(err => {
                        //     if (err) {
                        //         res.render('game/newbet', {error: err.message});
                        //     } else {
                        //         res.redirect('/rounds/' + bet.group);
                        //     }
                        // });
                    }
                });
            })
        })
    },

    groupEditBetGet: (req, res) => {
        let id = req.params.id
        GrBet.findById(id).populate('group').then(bet => {
            res.render('groups/editBet', {bet: bet})
        })
    },

    groupEditBetPost: (req, res) => {
        let id = req.params.id
        let args = req.body;
        // console.log(args);

        let [p1, p2, p3, p4] = [args.position1, args.position2, args.position3, args.position4]
        GrBet.findById(id).populate('author').populate('group').then(bet => {
            // console.log(bet);

            let errorMsg = '';
            if(!req.isAuthenticated()) {
                errorMsg = 'Трябва да сте влезнали в профила си!';
            } else if(req.user.userName !== bet.author.userName) {
                errorMsg = 'Не сте автор на прогнозата!';
            } else if(bet.group.date < new Date(Date.now())) {
                errorMsg = 'Времето за прогноза е изтекло!';
            } else if (
                (p1 !== '' && (p1 === p2 || p1 === p3 || p1 === p4)) ||
                (p2 !== '' && (p2 === p3 || p2 === p4)) ||
                (p3 !== '' && (p3 === p4))) {
                errorMsg = 'Не може да има дублиращи позиции!'
            }

            if(errorMsg) {
                res.render('groups/editBet', {error: errorMsg, bet: bet});
                return;
            }

            bet.position1 = Number(p1)
            bet.position2 = Number(p2)
            bet.position3 = Number(p3)
            bet.position4 = Number(p4)
            bet.save(err => {
                if (err) {
                    res.render('groups/editBet', {error: err.message, bet: bet});
                } else {
                    res.redirect('/');
                }
            });
        })
    },

    champNewBetGet: (req, res) => {
        let view = 'groups/champBet'
        Group.find().then(groups => {
            let teams = []
            for (let group of groups) {
                teams.push(group.team1)
                teams.push(group.team2)
                teams.push(group.team3)
                teams.push(group.team4)
            }

            res.render(view, {teams: teams})
        })
    },

    champNewBetPost: (req, res) => {
        let args = req.body
        let view = 'groups/champBet'

        let errorMsg = ''
        if(!req.isAuthenticated()) {
            errorMsg = 'Трябва да сте влезнали в профила си!'
        } else if(wDate < new Date(Date.now())) {
            errorMsg = 'Времето за прогноза е изтекло!'
        } else if (args.champion === undefined) {
            errorMsg = 'Не е избрана прогноза!'
        }

        if(errorMsg) {
            res.render(view, {error: errorMsg})
            return
        }

        let betArgs = {
            champion: args.champion,
            author: req.user.id
        }

        ChampBet.create(betArgs).then(bet => {
            res.redirect('/')
        }).catch(err => {
            res.render(view, {error: err.message})
        })
    },

    champEditBetGet: (req, res) => {
        let id = req.params.id
        let view = 'groups/champBet'

        ChampBet.findById(id).then(bet => {
            Group.find().then(groups => {
                let teams = []
                for (let group of groups) {
                    teams.push(group.team1)
                    teams.push(group.team2)
                    teams.push(group.team3)
                    teams.push(group.team4)
                }

                res.render(view, {teams: teams, bet: bet})
            })
        }).catch(err => {
            res.render(view, {error: 'Не е открита прогнозата в базата данни!'})
        })
    },

    champEditBetPost: (req, res) => {
        let id = req.params.id
        let args = req.body
        let view = 'groups/champBet'

        ChampBet.findById(id).populate('author').then(bet => {
            let errorMsg = ''
            if(!req.isAuthenticated()) {
                errorMsg = 'Трябва да сте влезнали в профила си!'
            } else if(wDate < new Date(Date.now())) {
                errorMsg = 'Времето за прогноза е изтекло!'
            } else if (args.champion === undefined) {
                errorMsg = 'Не е избрана прогноза!'
            } else if(req.user.userName !== bet.author.userName) {
                errorMsg = 'Не сте автор на прогнозата!';
            }
            // console.log(errorMsg);
            if(errorMsg) {
                res.render(view, {error: errorMsg, bet: bet})
                return
            }

            bet.champion = args.champion
            bet.save(err => {
                if (err) {
                    res.render(view, {error: err.message, bet: bet});
                } else {
                    res.redirect('/');
                }
            });
        }).catch(err => {
            res.render(view, {error: 'Не е открита прогнозата в базата данни!'})
        })
    },

    calcMatchPoints: calcPoints,

    calcGroupPoints: calcGroupPoints,

    worldChampObj: worldChampObj

}