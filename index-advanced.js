var express = require('express')
var app = express()
const fs = require('fs')
const path = require('path')
const url = require('url')
const pushOps = {
  status: 200, // optional
  method: 'GET', // optional
  request: {
    accept: '*/*'
  },
  response: {
    'content-type': 'application/javascript'
  }
}

let files = {}
fs.readdir('public', (error, data)=>{
  data.forEach(name=>{
    files[`/${name}`]=fs
      .readFileSync(path.join(__dirname, 'public', `/${name}`), {encoding: 'utf8'})
      .split('\n')
      .filter(line=>line.match(/script *?src *?= *?"(.*)"/)!=null)
      .map(line=>line.match(/script *?src *?= *?"(.*)"/)[1])
  })
  // console.log(files)
})
const logger = require('morgan')
app.use(logger('dev'))
app.use((request, response, next)=>{

  let urlName = url.parse(request.url).pathname
  // console.log(urlName, files)

  if (files[urlName]) {
    files[urlName].forEach((fileToPush)=>{
      console.log('Pushing', fileToPush)
      fs.createReadStream(path.join(__dirname, 'public', fileToPush))
        .pipe(response.push(`${fileToPush}`, pushOps))
    })

    response.sendFile(path.join(__dirname, 'public', urlName))
  } else {
    return next()
  }
})

app.get('/', function (request, response) {
  response.send('hello, http2!')
})

var options = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.crt')
}

app.get('/pushy', (request, response) => {
  var stream = response.push('/main.js', pushOps)
  stream.on('error', function() {
  })
  stream.end('alert("hello from push stream!");')
  response.end('<script src="/main.js"></script>')
})

require('spdy')
  .createServer(options, app)
  .listen(8080, ()=>{
    console.log(`Server is listening on https://localhost:8080.
You can open the URL in the browser.`)
  }
)