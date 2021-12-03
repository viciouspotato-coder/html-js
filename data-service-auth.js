const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

let Schema = mongoose.Schema;

let userSchema = new Schema({
    userName: {
        type: String,
        unique: true
    },
    password: String,
    email: String,
    loginHistory: [{ dateTime: Date, userAgent: String }]
});

let User; // to be defined on new connection (see initialize)

function initialize() {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb+srv://dbAdmin:potato@senecaweb.h0vrr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });
        db.on('error', (err) => {
            reject(err); // reject the promise with the provided error
        });
        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
}

function registerUser(userData) {
    return new Promise(function (resolve, reject) {
        if (userData.password != userData.password2) {
            reject("Passwords do not match")
        } else {
            bcrypt.genSalt(10)  // Generate a "salt" using 10 rounds
                .then(salt => bcrypt.hash(userData.password, salt)) // encrypt the password: "myPassword123"
                .then(hash => {
                    // TODO: Store the resulting "hash" value in the DB
                    let newUser = new User(userData);
                    newUser.password = hash;
                    newUser.save((err) => {
                        if (err) {
                            if (err.code == 11000) {
                                reject("User Name already taken");
                            } else {
                                reject("There was an error creating the user: " + err);
                            }
                        } else {
                            resolve();
                        }
                    });
                })
                .catch(err => {
                    console.log(err); // Show any errors that occurred during the process
                });
        }
    });
}

function checkUser(userData) {
    return new Promise(function (resolve, reject) {
        User.find({ userName: userData.userName })
            .exec()
            .then((users) => {
                if (!users) {
                    reject("Unable to find user: " + userData.userName);
                } else {
                    console.log("users '" + users[0].password + "' userData '" + userData.password + "'");
                    bcrypt.compare(userData.password, users[0].password).then((result) => {
                        // result === true if it matches and result === false if it does not match
                        if (result === true) {
                            users[0].loginHistory.push({ dateTime: (new Date()).toString(), userAgent: userData.userAgent });
                            User.updateOne(
                                { userName: users[0].userName },
                                { $set: { loginHistory: users[0].loginHistory } }
                            ).exec();
                            resolve(users[0]);
                        } else {
                            reject("Incorrect Password for user: " + userData.userName);
                        }
                    });
                }
            })
            .catch((err) => {
                reject("Unable to find user: " + userData.userName);
            });
    });
}

module.exports = { initialize, registerUser, checkUser };