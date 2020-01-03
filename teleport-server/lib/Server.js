'use strict'

const debug = require('debug')('teleport:server')

const http = require('http')
const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const serve = require('koa-static')
const mount = require('koa-mount');


const TunnelManager = require('./TunnelManager')

const app = new Koa()
const router = new Router()

class Server {
  constructor (opts = {}) {
    this.serverPort = parseInt(opts.serverPort)
    this.serverDomain = opts.serverDomain
    this.serverToken = opts.serverToken

    this.manager = new TunnelManager()
    this._server = null
    debug('created', opts)
  }

  generateBannerMessage (body) {
    return `
  Hit ctrl+c to close the tunnel
    `
  }

  async create () {
    app.use(async (ctx, next) => {
      try {
        await next()
      } catch (err) {
        ctx.status = err.status || 500
        ctx.body = {
          success: false,
          message: err.message
        }
        ctx.app.emit('error', err, ctx)
      }
    })

    app.use(mount('/assets', serve(__dirname + '/assets')));
    app.use(serve(__dirname + '/public',));
    
    // router.all('/', ctx => {
    //   yield send(this, __dirname + '/index.html');
    // })

    router.get('/status', async (ctx, next) => {
      ctx.body = {
        tunnels: this.manager.tunnels.size,
        mem: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime()
      }
    })

    router.get('/status/versions', async (ctx, next) => {
      ctx.body = require('../../teleport/package.json').version
    })

    router.get('/download', async (ctx, next) => {
      ctx.redirect(`/assets/teleport-${require('../../teleport/package.json').version}`)
      ctx.status = 302
    })

    router.get('/status/:internetPort', async (ctx, next) => {
      debug('/status', ctx.params.internetPort)
      const tunnel = this.manager.tunnels.get(parseInt(ctx.params.internetPort))
      if (!tunnel) { return ctx.throw(400, 'Tunnel not found') }
      const relay = tunnel.relay
      ctx.body = {
        internetPort: relay.internetPort,
        relayPort: relay.relayPort,
        createdAt: tunnel.createdAt
      }
    })

    // curl -d '{"internetPort":"2666", "relayPort":"2333", "serverToken": "hypertunnel-free-server-please-be-nice"}' -H "Content-Type: application/json" -X POST http://localhost:3000/create
    router.post('/create', async (ctx, next) => {
      debug('/create', ctx.request.body)
      const body = ctx.request.body
      console.log(body)
      if (body.serverToken !== this.serverToken) {
        ctx.throw(400, `Invalid serverToken`)
      }
      try {
        const opts = { }
        const tunnel = await this.manager.newTunnel(parseInt(body.internetPort) || 0, parseInt(body.relayPort) || 0, opts)
        ctx.body = {
          success: !!tunnel.relay,
          createdAt: tunnel.createdAt,
          relayPort: tunnel.relay.relayPort,
          internetPort: tunnel.relay.internetPort,
          secret: tunnel.secret,
          uri: `${this.serverDomain}:${tunnel.relay.internetPort}`,
          expiresIn: this.manager.maxAge
        }
        ctx.body.serverBanner = this.generateBannerMessage(ctx.body)
      } catch (err) {
        console.log(err)
        ctx.throw(400, `Tunnel creation failed`)
      }
    })

    router.post('/delete', async (ctx, next) => {
      const body = ctx.request.body
      if (body.serverToken !== this.serverToken) {
        ctx.throw(400, `Invalid serverToken`)
      }
      try {
        const success = this.manager.remove(parseInt(body.internetPort) || 0, body.secret)
        ctx.body = {
          success: !!success,
          message: success
        }
      } catch (err) {
        console.log(err)
        ctx.throw(400, `Tunnel deletion failed`)
      }
    })

    app.use(bodyParser())
    app.use(router.routes())
    app.use(router.allowedMethods())

    app.use(async function pageNotFound (ctx) {
      ctx.throw(404, `Not found`)
    })

    app.on('error', err => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(err)
      }
    })

    await new Promise(resolve => {
      this._server = http.createServer(app.callback()
      ).listen(this.serverPort, () => {
        console.log('Server listening on port', this.serverPort)
        return resolve()
      })
    })
    return this
  }

  close () {
    this.manager.removeAll()
    this._server.close()
  }
}

module.exports = Server
