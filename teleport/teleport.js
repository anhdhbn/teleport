#!/usr/bin/env node
'use strict'

const program = require('commander')

const  Client  = require('./lib/Client')
const { version } = require('./package')

module.exports = async (argv) => {
  program
    .version(version, '-v, --version')
    .description('Expose any local TCP/IP service on the internet.')
    .usage('--port 8080 [options]')
    .option('-p, --port [port]', 'local TCP/IP service port to tunnel', parseInt)
    .option('-i, --internet-port [port]', 'the desired internet port on the public server', parseInt)
    .parse(argv)

  if (!program.port) { program.help() }

  const errorWrapper = (err) => {
    console.warn(`
      An unexpected error occured.
    `)
    console.error(err)
    process.exit(1)
  }
  process.on('uncaughtException', (err) => { errorWrapper(err) })
  process.on('unhandledRejection', (reason, promise) => { errorWrapper(reason) })

  const deleteTunnel = async (client) => {
    await client.close()
  }

  const client = new Client(program.port, {
    host: "localhost",
    server: "s0.anhdh.tk:80",
    token:  require("./package.json").version,
    internetPort: program.internetPort
  })
  await client.create()
  let message = `
  ✨  Hypertunnel created.

  Tunneling ${client.uri} > ${client.host}:${client.port}
  `
  if (client.serverBanner) { message += client.serverBanner }
  console.log(message)

  ;['SIGINT', 'SIGTERM'].forEach(signal => process.on(signal, async () => {
    await deleteTunnel(client)
    console.log('  Tunnel closed.')
    process.exit(0)
  }))

  if (client.expiresIn) {
    setTimeout(async () => {
      await deleteTunnel(client)
      console.log('  Tunnel expired.')
    }, client.expiresIn * 1000) // Convert s to ms
  }
}

module.exports(process.argv)
