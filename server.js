const express = require('express')
const Sequelize = require('sequelize')
const striptags = require('striptags')

const app = express()
const sequelize = new Sequelize(`sqlite:${__dirname}/.data/database.sqlite`)

app.use(express.json())
app.use(express.static(__dirname + '/public'))

const Question = sequelize.define('question', {
    question: Sequelize.TEXT
})

// Setup socket.io
const http = require('http').Server(app)
const io = require('socket.io')(http)

// io testing
io.on('connection', socket => {
    console.log('Socket connected!', socket.id)
})

app.get('/questions', (req, res) => {
    let query = {
        order: [
            ['createdAt', 'DESC']
        ]
    }

    return Question.findAll(query).then(questions => {
        res.json(questions)
    })
})

app.post('/questions', (req, res) => {
    let question = striptags(req.body.question)

    if (question) {
        return Question.create({
            question
        }).then(q => {
            res.status(201).json(q)

            io.emit('new question', q)
        }).catch(error => {
            res.status(500).json({
                error
            })
        })
    }

    return res.status(422).json({
        message: 'Missing question'
    })
})

sequelize.sync()
.then(() => {
    http.listen(3000, () => {
        console.log('Server started!')
    })
})