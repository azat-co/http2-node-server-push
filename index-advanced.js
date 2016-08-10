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
    'Content-Type': 'application/javascript'
  }
}

let files = {}
fs.readdir('public', (error, data)=>{
  data.forEach(name=>{
    files[`${name}`]=fs
      .readFileSync(path.join(__dirname, 'public', `${name}`), {encoding: 'utf8'})
      .split('\n')
      .filter(line=>line.match(/src *?= *?"(.*)"/)!=null)
      .map(line=>line.match(/src *?= *?"(.*)"/)[1])
  })
})

const logger = require('morgan')
app.use(logger('dev'))
app.use((request, response, next)=>{
  let urlName = url.parse(request.url).pathname.substr(1)
  console.log('Request for: ', urlName)
  if (urlName === '' || urlName === '/') urlName = 'index.html'
  if (files[urlName]) {
    // let assets = []
    let assets = files[urlName]
      .filter(name=>(name.substr(0,4)!='http'))
      .map((fileToPush)=>{
        let fileToPushPath = path.join(__dirname, 'public', fileToPush)
        return (cb)=>{
          fs.readFile(fileToPushPath, (error, data)=>{
            if (error) return cb(error)
            console.log('Will push: ', fileToPush, fileToPushPath)
            try {
              response.push(`/${fileToPush}`, {}).end(data)
              // response.push(`/${fileToPush}`, pushOps).end(data) 
              cb()
            } catch(e) {
              cb(e)
            }

          })
        }
      })
    console.log('Total number of assets to push: ', assets.length)

    require('neo-async').parallel(assets, (results)=>{
      // console.log('end', results)
      fs.readFile(path.join(__dirname, 'public', urlName), (error, data)=>{
        if (error) return cb(error)
        response.write(data)
        response.end()
      })

    })
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