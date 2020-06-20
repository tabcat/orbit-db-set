
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
  }

  static get type () { return type }

  get size () { return this.index.size }
  get has () { return this.index.has.bind(this.index) }
  get keys () { return this.index.keys.bind(this.index) }
  get values () { return this.index.values.bind(this.index) }
  get entries () { return this.index.entries.bind(this.index) }
  get forEach () { return this.index.forEach.bind(this.index) }

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
