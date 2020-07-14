
'use strict'

const opcodes = {
  ADD: 'ADD',
  DELETE: 'DELETE',
  CLEAR: 'CLEAR'
}

class SetIndex {
  constructor () {
    this._index = new Set()
  }

  static get opcodes () { return opcodes }

  get () {
    return this._index
  }

  updateIndex (oplog, onProgressCallback) {
    const entries = oplog.values.slice().reverse()
    const set = new Set()
    const handled = new Set()
    let idx = 0

    for (const entry of entries) {
      try {
        switch (entry.payload.op) {
          case opcodes.ADD:
            if (!handled.has(entry.payload.value)) {
              set.add(entry.payload.value)
              handled.add(entry.payload.value)
            }
            break
          case opcodes.DELETE:
            if (!handled.has(entry.payload.value)) {
              handled.add(entry.payload.value)
            }
            break
          case opcodes.CLEAR:
            this._index = set
            return // entries before CLEAR are not relevant
          default:
            break
        }
      } finally {
        if (onProgressCallback) onProgressCallback(entry, idx)
        idx += 1
      }
    }

    this._index = set
  }
}

module.exports = SetIndex
