const { prisma } = require('../lib/prisma')
const authenticateToken = require('../middleware/authenticateToken')
const requireAdmin = require('../middleware/requireAdmin')
const multer = require('multer')
const fs = require('fs/promises')
const cloudinary = require('../lib/cloudinary')
// ***change this to upload to a image service

const postRoutes = require('express').Router()

//multer upload config
const upload = multer({
    dest: "uploads/",
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter(req, file, cb) {
        const allowedMimeTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
        }
    }
});

//CREATE post
postRoutes.post('/', upload.single('image'), authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const { title, content } = req.body;

        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({
                msg: "Title and content are required!"
            });
        }
        let imageUrl = null;
        let publicId = null;

        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(
                    req.file.path,
                    {
                        resource_type: "image",
                        folder: "blog-posts"
                    }
                );

                console.log("CLOUDINARY UPLOAD SUCCESS:", result.secure_url);

                imageUrl = result.secure_url;
                publicId = result.public_id;


            } finally {
                await fs.unlink(req.file.path).catch(() => {});
            }
        }

        const post = await prisma.post.create({
            data: {
                title,
                content,
                image_url: imageUrl,
                image_public_id: publicId,
                authorId: req.user.id
            }
        });

        return res.status(201).json(post)

        
    } catch(err) {
        console.error("POST /posts ERROR:", err);
        console.error("ERROR NAME:", err.name);
        console.error("ERROR MESSAGE:", err.message);
        console.error("HTTP CODE:", err.http_code);
        console.error("ERROR DETAILS:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
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
                published: true,
                image_url: true,
                _count: {
                    select: {
                        comments: true
                    }
                }
            }
        })

        return res.status(200).json(posts)
    } catch(err) {
        next(err)
    }
})

//READ/GET posts as admin
postRoutes.get('/admin', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const allPosts = await prisma.post.findMany({
            select: {
                id: true,
                title: true,
                content: true,
                created_at: true,
                published: true,
                image_url: true,            
            }
        })

        return res.status(200).json({allPosts})
    } catch(err) {
        console.error("GET /posts/admin error:", err)
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
                published: true,
                image_url: true,
                _count: {
                    select: {
                        comments: true
                    }
                }
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

        const post =  await prisma.post.findUnique({
            where: {
                id: postId
            }
        })

        if (!post) {
            return res.status(404).json({
                msg: "Post not found!"
            })
        }

        if (post.image_public_id) {
            await cloudinary.uploader.destroy(post.image_public_id);
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