const loginRoute = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');

loginRoute.post('/', async (req, res, next) => {
    try{
        const { username, password } = req.body;
        if(!username || !password) {
            return res.status(400).json({
                msg: "Username and Password required!"
            })
        }
        const user = await prisma.user.findUnique({
            where: {
                username
            }
        })

        if(!user) {
            return res.status(401).json({msg: "Invalid username or password!"})
        }
        const verifyPassword = await bcrypt.compare(password, user.password)
        if(!verifyPassword) {
            return res.status(401).json({msg: "Invalid username or password!"})
        }
        const token = jwt.sign({
            id: user.id,
            username: user.username,
            isAdmin: user.isAdmin,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h"
        })
        return res.status(200).json({token})
    } catch(err) {
        next(err)
    }
})
module.exports = loginRoute;