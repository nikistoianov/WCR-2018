const userController = require('./../controllers/user');
const homeController = require('./../controllers/home');
const articleController = require('./../controllers/article');
const gameController = require('./../controllers/game');

module.exports = (app) => {
    app.get('/', homeController.index);

    app.get('/rounds/:id', gameController.roundGet);
    app.get('/group', gameController.groupGet);

    app.get('/user/register', userController.registerGet);
    app.post('/user/register', userController.registerPost);

    app.get('/user/login', userController.loginGet);
    app.post('/user/login', userController.loginPost);

    app.get('/user/logout', userController.logout);

    app.get('/game/create', gameController.newMatchGet);
    app.post('/game/create', gameController.newMatchPost);

    app.get('/bet/:id', gameController.betGet);
    app.post('/game/bet/:id', gameController.betPost);

    app.get('/newbet/:id', gameController.newbetGet);
    app.post('/game/newbet/:id', gameController.newbetPost);

    app.get('/game/matchresult/:id', gameController.matchResultGet);
    app.post('/game/matchresult/:id', gameController.matchResultPost);

    app.get('/game/matchedit/:id', gameController.matchEditGet);
    app.post('/game/matchedit/:id', gameController.matchEditPost);

    app.get('/game/matchdelete/:id', gameController.matchDeleteGet);

    app.get('/game/groupbet/:id', gameController.createGroupBetGet);

    app.get('/groups/create', gameController.newGroupGet);
    app.post('/groups/create', gameController.newGroupPost);

    app.get('/groups/edit/:id', gameController.groupEditGet);
    app.post('/groups/edit/:id', gameController.groupEditPost);

    app.get('/groups/newBet/:id', gameController.groupNewBetGet);
    app.post('/groups/newBet/:id', gameController.groupNewBetPost);

    app.get('/groups/editBet/:id', gameController.groupEditBetGet);
    app.post('/groups/editBet/:id', gameController.groupEditBetPost);

    app.get('/groups/champBet', gameController.champNewBetGet);
    app.post('/groups/champBet', gameController.champNewBetPost);

    app.get('/groups/champBet/:id', gameController.champEditBetGet);
    app.post('/groups/champBet/:id', gameController.champEditBetPost);
};

