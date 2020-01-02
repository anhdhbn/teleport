var Server = require("./lib/Server")

module.exports = async () => {
  serverPort = process.env.PORT ||  80
  serverDomain = process.env.DOMAIN || "s0.anhdh.tk"
  serverToken =  process.env.TOKEN || require("../teleport/package.json").version
  if(!serverDomain) {
    console.error("Must enter domain server")
    process.exit(0)
  }

  if(!serverPort) {
    console.error("Must enter port server")
    process.exit(0)
  }

  const server = new Server({
    serverPort: serverPort,
    serverDomain: serverDomain,
    serverToken: serverToken,
  })
  await server.create()
  process.on('uncaughtException', (err) => {
    console.error(err)
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error(reason)
  })
}

module.exports()

