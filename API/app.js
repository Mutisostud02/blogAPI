require('dotenv').config()
const express = require('express');
const app = express()

const port = process.env.PORT || 5000

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.get('/', (req, res) => {
    res.json('Hello world')
})

app.listen(port, () => console.log(`Server running at port ${port}`))