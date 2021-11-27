const express = require('express')
const main = require('./bot')

const app = express()
app.use(express.static('.'))
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

let port = process.env.PORT || 4000

app.listen(port, () => console.log(`STARTED AT ${port}`))