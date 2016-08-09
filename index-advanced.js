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
  if (urlName === '' || urlName === '/') urlName = '/index.html'
  if (files[urlName]) {

    fs.createReadStream(path.join(__dirname, 'public', urlName))
      .pipe(response)
    files[urlName].forEach((fileToPush)=>{
      console.log('Pushing', fileToPush)
      fs.createReadStream(path.join(__dirname, 'public', fileToPush))
        .pipe(response.push(`${fileToPush}`, pushOps))
    })
    response.end()
    // response.sendFile(path.join(__dirname, 'public', urlName))
  } else {
    return next()
  }
})


var options = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.crt')
}

require('spdy')
  .createServer(options, app)
  .listen(8080, ()=>{
    console.log(`Server is listening on https://localhost:8080.
You can open the URL in the browser.`)
  }
)