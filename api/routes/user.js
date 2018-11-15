const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const JWT_KEY = "secret";

router.post("/signup", (req, res, next) => {
    User.find({ email: req.body.email })
        .exec()
        .then(user => {
            if (user.length >= 1) {
                return res.status(409).json({
                    message: "email already regestered"
                });
            } else {
                var name = splitName(req.body.fullName);
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        return res.status(500).json({
                            error: err
                        });
                    } else {
                        const user = new User({
                            _id: new mongoose.Types.ObjectId(),
                            email: req.body.email,
                            password: hash,
                            firstName: name[0],
                            lastName: name[1],
                            countryCode: req.body.countryCode,

                        });
                        user.save()
                            .then(result => {
                                console.log(result);
                                res.status(201).json({
                                    message: "User created"
                                });
                            })
                            .catch(err => {
                                console.log(err);
                                res.status(500).json({
                                    error: err
                                });
                            });
                    }
                });
            }
        });
});

router.post("/login", (req, res, next) => {
    User.find({ email: req.body.email })
        .exec()
        .then(user => {
            if (user.length < 1) {
                return res.status(401).json({
                    message: "Auth failed"
                });
            }
            bcrypt.compare(req.body.password, user[0].password, (err, result) => {
                if (err) {
                    return res.status(401).json({
                        message: "Auth failed"
                    });
                }
                if (result) {
                    const token = jwt.sign(
                        {
                            email: user[0].email,
                            userId: user[0]._id
                        },
                        JWT_KEY,
                        {
                            expiresIn: "7d"
                        }
                    );
                    return res.status(200).json({
                        message: "Auth successful",
                        token: token
                    });
                }
                res.status(401).json({
                    message: "Auth failed"
                });
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

router.delete("/:userId", (req, res, next) => {
    User.remove({ _id: req.params.userId })
        .exec()
        .then(result => {
            res.status(200).json({
                message: "User deleted"
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

router.post("/updateProfile", (req, res, next) => {
    console.log("update profile",req.body);
    User.findOne({ email: req.body.email }).exec().then(user => {        
        if(user) {
            User.updateOne({ email: req.body.email }, {
                $set: { firstName: req.body.firstName, lastName: req.body.lastName, age: req.body.age, password: req.body.password }
            }).exec().then(result => {
                res.status(201).json({
                    message: "Profile Updated"
                });
            });
        } else {
            res.status(500).json({
                error: "No user Found"
            });
        }
    })
});

function splitName(fullName) {
    var name = [];
    console.log(this.fullName);
    name[0] = fullName.split(' ').slice(0, -1).join(' ');
    name[1] = fullName.split(' ').slice(-1).join(' ');
    return name;
}

module.exports = router;