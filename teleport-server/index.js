var Server = require("./lib/Server")

module.exports = async () => {
  serverPort = process.env.PORT || 8081
  serverDomain = process.env.DOMAIN || "localhost"
  serverToken =  process.env.TOKEN || require("../teleport/package.json").version
  if(!serverDomain) {
    console.error("Must enter domain server")
    process.exit(0)
  }

  const server = new Server({
    serverPort: serverPort,
    serverDomain: serverDomain,
    serverToken: serverToken,
    landingPage: "https://viblo.asia/p/gioi-thieu-ve-koajs-E375zyARlGW"
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

