var express = require('express')
var app = express()
const fs = require('fs')
app.get('/', function (req, res) {
  res.send('hello, http2!')
})

var options = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.crt')
}

app.get('/pushy', (req, res) => {
  var stream = res.push('/main.js', {
    status: 200, // optional
    method: 'GET', // optional
    request: {
      accept: '*/*'
    },
    response: {
      'content-type': 'application/javascript'
    }
  })
  stream.on('error', function() {
  })
  stream.end('alert("hello from push stream!");')
  res.end('<script src="/main.js"></script>')
})

require('spdy')
  .createServer(options, app)
  .listen(8080, ()=>{
    console.log(`Server is listening on https://localhost:8080.
    You can open the URL in the browser.`)
  }
)