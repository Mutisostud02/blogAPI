const { prisma } = require('../lib/prisma')
const authenticateToken = require('../middleware/authenticateToken')
const requireAdmin = require('../middleware/requireAdmin')

const usersRoute = require('express').Router()

//getUsers
usersRoute.get('/', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                isAdmin: true,
                _count: {
                    select: {
                        comments: true,
                        posts: true,
                    }
                }
            }
        })

        return res.status(200).json(users)

    } catch(err) {
        next(err)
    }
})


//getUser 
usersRoute.get('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const userId = Number(req.params.id);

        if(Number.isNaN(userId)) {
            return res.status(400).json( {
                msg: "Invalid User ID"
            })
        }

        const user = await prisma.user.findUnique({
            where: {
                id : userId
            },
            select: {
                id: true,
                username: true,
                // created_at: true,
                email: true,
                _count: {
                    select: {
                        comments: true,
                    }
                },
                isAdmin: true
            }
        })

            if (!user) {
                return res.status(404).json({
                    msg: "No user found"
                })
            }

            return res.status(200).json(user)

    } catch (err) {
        next(err)
    }
})

usersRoute.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const userId = Number(req.params.id);

        if(Number.isNaN(userId)) {
            return res.status(400).json( {
                msg: "Invalid User ID"
            })
        }

        const user = await prisma.user.findUnique({
            where: {
                id : userId
            }
        })
       
        if (!user) {
            return res.status(404).json({
                msg: "No user found"
            })
        }

        if(user.isAdmin) {
            return res.status(403).json({
                msg: "Cannot delete Admin user"
            })
        }

        await prisma.user.delete({
            where: {
                id: user.id
            }
        })

        return res.status(204).send()
 
    } catch (err) {
        next(err)
    }
})

module.exports = usersRoute;