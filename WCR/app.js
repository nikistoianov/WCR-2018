const express = require('express');
const config = require('./config/config');
const app = express();

app.use("/public", express.static('public'));

let env = 'development';
require('./config/database')(config[env]);
require('./config/express')(app, config[env]);
require('./config/passport')();
require('./config/routes')(app);

module.exports = app;