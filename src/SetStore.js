
'use strict'

const Store = require('orbit-db-store')
const SetIndex = require('./SetIndex')
const { opcodes } = SetIndex

const type = 'set'

class SetStore extends Store {
  constructor (ipfs, id, dbname, options = {}) {
    if (!options.Index) Object.assign(options, { Index: SetIndex })
    super(ipfs, id, dbname, options)
    this._type = type

    this.entries = this.index.entries
    this.forEach = this.index.forEach
    this.has = this.index.has
    this.keys = this.index.keys
    this.values = this.index.values
  }

  static get type () { return type }

  get size () { return this.index.size }

  async add (value) {
    return this._addOperation({ op: opcodes.ADD, value })
  }

  async delete (value) {
    return this._addOperation({ op: opcodes.DELETE, value })
  }

  async clear () {
    return this._addOperation({ op: opcodes.CLEAR })
  }
}

module.exports = SetStore
