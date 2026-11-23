require('dotenv').config()
const express = require('express');
const router = require('./routes');
const postRoutes = require('./routes/post');
const signupRoute = require('./routes/signup');
const loginRoute = require('./routes/login');
const { postCommentsRouter, commentsRouter } = require('./routes/comment');
const cors = require('cors');
const usersRoute = require('./routes/users');

const app = express()

const port = process.env.PORT || 5000

const allowedOrigins = (process.env.FRONTEND_URLS || '')
  .split(',')
  .map(url => url.trim())
   .filter(Boolean);

app.use(cors({
    origin: allowedOrigins
}))


app.use(express.json())
app.use(express.urlencoded({extended: true}))


app.use('/', router)
app.use('/signup', signupRoute)
app.use('/login', loginRoute)
app.use('/users', usersRoute)
app.use('/posts', postRoutes)
app.use('/posts', postCommentsRouter)
app.use('/comments', commentsRouter)

app.use((err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        msg: err.message
    });
});

app.listen(port, () => console.log(`Server running at port ${port}`))

