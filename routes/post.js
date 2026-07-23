const { prisma } = require('../lib/prisma')
const authenticateToken = require('../middleware/authenticateToken')
const requireAdmin = require('../middleware/requireAdmin')

const postRoutes = require('express').Router()

//CREATE post
postRoutes.post('/', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const { title, content } = req.body;
        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({
                msg: "Title and content are required!"
            });
        }

        const post = await prisma.post.create({
            data: {
                title,
                content,
                authorId: req.user.id
            }
        });

        return res.status(201).json(post)

        
    } catch(err) {
        next(err)
    }

})

//READ/GET posts
postRoutes.get('/', async (req, res, next) => {
    try {
        const posts = await prisma.post.findMany({
            where: {
                published: true
            },
            select: {
                id: true,
                title: true,
                content: true,
                created_at: true,
            }
        })

        return res.status(200).json(posts)
    } catch(err) {
        next(err)
    }
})

//READ/GET admin posts
postRoutes.get('/admin', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const allPosts = await prisma.post.findMany({
            select: {
                id: true,
                title: true,
                content: true,
                created_at: true,
                published: true                
            }
        })

        return res.status(200).json({allPosts})
    } catch(err) {
        next(err)
    }
})

//READ/GET one post 
postRoutes.get('/:id', async (req, res, next) => {
    try{
        const postId = Number(req.params.id)

        if(Number.isNaN(postId)) {
            return res.status(400).json({msg: "Invalid post id"})
        }

        const post = await prisma.post.findFirst({
            where: {
                id: postId,
                published: true
            },
            select: {
                id: true,
                title: true,
                content: true,
                created_at: true,
            }
        })

        if(!post) {
            return res.status(404).json({msg: "Post not found"})
        }

        return res.status(200).json(post)

    } catch(err) {
        next(err)
    }
})

// publish/unpublished post
postRoutes.patch('/:id/published', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const publishPostId = Number(req.params.id)

        if(Number.isNaN(publishPostId)) {
            return res.status(400).json({msg: "invalid post ID"})
        }

        const post = await prisma.post.findUnique({
            where: {
                id: publishPostId
            }
        })

        if(!post) {
            return res.status(404).json({
                msg: "Post not found"
            })
        }

        const updatedPost = await prisma.post.update({
            where: {
                id: publishPostId
            },
            data: {
                published: !post.published
            }
        })

        return res.status(200).json(updatedPost)
    } catch(err) {
        next(err)
    }
})

//PUT update post
postRoutes.put('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
    try{
        const { title, content } = req.body;
        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({
                msg: "Title and content are required!"
            });
        }
        const postId = Number(req.params.id)

        if (Number.isNaN(postId)) {
            return res.status(400).json({
                msg: "Invalid post ID"
            });
        }
        const updatedPost = await prisma.post.update({
            where: {
                id: postId
            },
            data: {
                title,
                content
            }
        })
        return res.status(200).json(updatedPost)
    } catch(err) {
        if(err.code === "P2025") {
            return res.status(404).json({msg: "Post not found!"})
        }
        next(err)
    }
})

//DELETE post
postRoutes.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const postId = Number(req.params.id)

        if (Number.isNaN(postId)) {
            return res.status(400).json({
                msg: "Invalid post ID"
            });
        }

        await prisma.post.delete({
            where: {
                id: postId
            }
        })

        return res.status(204).send()
    } catch(err) {
        if(err.code === "P2025") {
            return res.status(404).json({msg: "Post not found!"})
        }
        next(err)
    }
})

module.exports = postRoutes;