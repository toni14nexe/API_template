const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const User = require("../models/user")

exports.get_all_users = (req, res, next) => {
    User.find()
        .select('_id username role')
        .exec()
        .then(docs => {
            res.status(200).json({
                total: docs.length,
                Users: docs
            })
        })
        .catch(error => res.status(500).json({ error: error }))
}

exports.get_one_user = (req, res, next) => {
    User.findById(req.params.userId)
        .select('_id username role')
        .exec()
        .then(doc => {
            if(doc) res.status(200).json(doc)
            else res.status(404).json({ Message: 'No valid entry found for provided ID' })
        })
        .catch(error => res.status(500).json({ error: error }))
}

exports.user_signup = (req, res, next) => {
    User.find({ username: req.body.username })
        .exec()
        .then(user => { 
            if(user.length > 0) return res.status(409).json({ message: 'Username already exists' })
            else {
                bcrypt.hash(req.body.password, 10, (error, hash) => {
                    if(error) return res.status(500).json({ error: error })
                    else {
                        const user = new User({
                            _id: new mongoose.Types.ObjectId(),
                            username: req.body.username,
                            password: hash,

                            // ---------- ROLE ADJUSTMENT ----------

                            // 'role' use only when creating fist user -> superadmin or admin
                            // default when creating is 'user':
                             role: req.body.role
                        })
                        user.save()
                            .then(() => res.status(201).json({ message: 'User saved successfully' }))
                            .catch((error) => res.status(500).json({ error: error }))
                    }
                })
            }
        })
}

exports.user_login = (req, res, next) => {
    User.findOne({ username: req.body.username })
        .exec()
        .then(user => {
            if(user) {
                bcrypt.compare(req.body.password, user.password, (error, result) => {
                    if(error || !result) res.status(401).json({ message: 'Authentication failed' })
                    else {
                        const token = jwt.sign(
                            {
                                _id: user._id,
                                username: user.username,
                            }, 
                            process.env.TOKEN_SECRET_KEY,
                            { expiresIn: '1h' },

                        )
                        res.status(200).json({
                            message: 'Authentication successful',
                            user: {
                                _id: user._id,
                                username: user.username,
                                role: user.role,
                                token: token
                            }
                        })
                    }
                })
            }
            else res.status(401).json({ message: 'User doesn\'t exists' })
        })
        .catch(error => res.status(500).json({ error: error }))
}

exports.delete_user = (req, res, next) => {
    User.deleteOne({ _id: req.params.userId })
        .exec()
        .then(result => res.status(200).json({
            message: 'User was deleted successfully'
        }))
        .catch(error => res.status(500).json({ error: error }))
}