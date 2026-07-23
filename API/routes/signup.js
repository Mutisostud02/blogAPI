const signupRoute = require('express').Router()
const { Prisma } = require('@prisma/client/extension');
const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');
signupRoute.post('/', async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        if(!username || !email || !password) {
            return res.status(400).json({msg: "username, email, password required!"})
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                        { username },
                        { email }
                ]
            }
        })

        if(existingUser) {
            return res.status(409).json({
                msg: "Username or email already exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                username: username,
                email: email,
                password: hashedPassword,
            }
        })
        res.status(201).json(user)

    } catch(err) {
        next(err)
    }
})

module.exports = signupRoute;