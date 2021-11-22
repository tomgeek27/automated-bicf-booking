const express = require('express')
const main = require('./bot')

const app = express()


app.get('/normal', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    main(res, false)

})

app.get('/lm', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    main(res, true)

})

app.listen(4000)