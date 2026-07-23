///start here

const { prisma } = require('../lib/prisma');
const authenticateToken = require('../middleware/authenticateToken');

const postCommentsRouter = require('express').Router()
const commentsRouter = require('express').Router()


//CREATE comment
postCommentsRouter.post('/:id/comments', authenticateToken, async (req, res, next) => {
    try {
        const { content } = req.body;

        if(!content?.trim()) {
            return res.status(400).json({
                msg: "Content is required"
            })
        }

        const postId = Number(req.params.id);

        if(Number.isNaN(postId)) {
            return res.status(400).json({
                msg: "Invalid post id"
            })
        }

        const post = await prisma.post.findUnique({
            where: {
                id: postId
            }
        })

        if(!post) {
            return res.status(404).json({
                msg: "Post not found"
            })
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                authorId: req.user.id,
                postId
            },
            select: {
                id: true,
                authorId: true,
                content: true,
                postId: true,
                created_at: true
            }
        })

        return res.status(201).json(comment)
    } catch (err) {
        next(err)
    }   

})

//GET/READ comments
postCommentsRouter.get('/:id/comments', async (req, res, next) => {
    try {
        const postId = Number(req.params.id);

        if(Number.isNaN(postId)) {
            return res.status(400).json({
                msg: "Invalid post id"
            })
        }

        const post = await prisma.post.findFirst({
            where: {
                id: postId,
                published: true
            }
        })

        if(!post) {
            return res.status(404).json({
                msg: "Post not found"
            })
        }

        const comments = await prisma.comment.findMany({
            where: {
                postId
            },
            select: {
                id: true,
                content: true,
                postId: true,
                created_at: true,
                author: {
                    select: {
                        username: true
                    }
                }
            }
        })

        return res.status(200).json({comments})

    } catch(err) {
        next(err)
    }
})

//GET single comment
commentsRouter.get('/:commentId', async (req, res, next) => {
    try {
        const commentId = Number(req.params.commentId)

        if(Number.isNaN(commentId)) {
            return res.status(400).json({
                msg: "Invalid comment id"
            })
        }

        const comment = await prisma.comment.findUnique({
            where: {
                id: commentId
            },
            select: {
                id: true,
                content: true,
                postId: true,
                created_at: true,
                author: {
                    select: {
                        username: true
                    }
                }
            }
        })

        if(!comment) {
            return res.status(404).json({
                msg: "Comment not found"
            })
        }
        
        return res.status(200).json(comment)

    } catch (err) {
        next(err)
    }
})

//UPDATE comment
commentsRouter.put('/:commentId', authenticateToken, async (req, res, next) => {
    try {
        const commentId = Number(req.params.commentId)

        if(Number.isNaN(commentId)) {
            return res.status(400).json({
                msg: "Invalid comment id"
            })
        }

        const { content } = req.body

        if(!content?.trim()) {
            return res.status(400).json({
                msg: "Content is required"
            })
        }

        const comment = await prisma.comment.findUnique({
            where: {
                id: commentId
            }
        })

        if(!comment) {
            return res.status(404).json({
                msg: "Comment not found"
            })
        }

        if(comment.authorId !== req.user.id) {
            return res.status(403).json({
                msg: "You can only edit your own comments"
            });
        }

        const updatedComment = await prisma.comment.update({
            where: {
                id: commentId
            },
            data: {
                content
            }
        })

        return res.status(200).json(updatedComment)

    } catch (err) {

        next(err)
    }
})

//DELETE comment
commentsRouter.delete('/:commentId', authenticateToken, async (req, res, next) => {
    try {
        const commentId = Number(req.params.commentId)

        if(Number.isNaN(commentId)) {
            return res.status(400).json({
                msg: "Invalid comment id"
            })
        }

        const comment = await prisma.comment.findUnique({
            where: {
                id: commentId
            }            
        })
        
        if(!comment) {
            return res.status(404).json({
                msg: "Comment not found"
            })
        }


        if(comment.authorId !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({
                msg: "User not authorized"
            })
        }

        await prisma.comment.delete({
            where: {
                id: commentId
            }
        })

        return res.status(204).send();

    } catch (err) {

        next(err)
    }
})

module.exports = { postCommentsRouter, commentsRouter };