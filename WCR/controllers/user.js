const User = require('mongoose').model('User');
const encryption = require('./../utilities/encryption');

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
    }
};
