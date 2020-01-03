'use strict'

const debug = require('debug')('teleport:client')

const { RelayClient } = require('../../teleport-tcp-relay').Client
const got = require('got')

/**
 * A teleport client.
 */
class Client {
  constructor (port, opts = {}) {
    this.port = port
    this.host = opts.host
    this.server = `${opts.domain}:${opts.portServer}`
    this.domain = opts.domain
    this.token = opts.token
    this.desiredInternetPort = opts.internetPort

    this.deleted = false
    this.relay = null
    this.internetPort = null
    this.relayPort = null
    this.uri = null
    this.secret = null
    this.createdAt = null
    this.expiresIn = null
    this.serverBanner = null

    debug(`created`, this)
  }

  async create () {
    const payload = {
      serverToken: this.token,
      internetPort: this.desiredInternetPort,
      relayPort: this.port
    }
    const { body } = await got.post(`http://${this.server}/create`, { json: payload, throwHttpErrors: false, responseType: 'json' })
    if (!body.success) { throw new Error(body && body.message ? body.message : 'Unexpected response') }
    this.createdAt = body.createdAt
    this.internetPort = body.internetPort
    this.relayPort = body.relayPort
    this.secret = body.secret
    this.uri = body.uri
    this.expiresIn = body.expiresIn
    this.serverBanner = body.serverBanner

    this.relay = new RelayClient({
      host: this.host,
      port: this.port,
      relayHost: this.domain,
      relayPort: this.relayPort
    }, { secret: this.secret })
    return this
  }

  async delete () {
    if (this.deleted) { return true }
    const payload = {
      serverToken: this.token,
      internetPort: this.internetPort,
      secret: this.secret
    }
    const { body } = await got.post(`http://${this.server}/delete`, { json: payload, throwHttpErrors: false ,responseType: 'json' })
    debug('delete', body)
    if (!body.success) { throw new Error(body && body.message ? body.message : 'Unexpected response') }
    this.deleted = true
    return true
  }

  async close () {
    this.relay.end()
    await this.delete()
    return true
  }
}

module.exports = Client
