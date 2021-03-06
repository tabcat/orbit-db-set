
'use strict'

const assert = require('assert')
const rmrf = require('rimraf')
const path = require('path')
const OrbitDB = require('orbit-db')
const SetStore = require('../src')
OrbitDB.addDatabaseType(SetStore.type, SetStore)

const {
  config,
  startIpfs,
  stopIpfs,
  testAPIs
} = require('orbit-db-test-utils')

const dbPath = './orbitdb/tests/fsstore'
const ipfsPath = './orbitdb/tests/fsstore/ipfs'

Object.keys(testAPIs).forEach(API => {
  describe(`orbit-db - Set Store (${API})`, function () {
    this.timeout(config.timeout)
    const dbname = 'orbit-db-set'

    let ipfsd, ipfs, orbitdb, db, dbAddr

    before(async () => {
      config.daemon1.repo = ipfsPath
      rmrf.sync(config.daemon1.repo)
      ipfsd = await startIpfs(API, config.daemon1)
      ipfs = ipfsd.api
      orbitdb = await OrbitDB.createInstance(ipfs, { directory: path.join(dbPath) })
      dbAddr = await orbitdb.determineAddress(dbname, SetStore.type)
    })

    after(async () => {
      if (orbitdb) await orbitdb.stop()
      if (ipfsd) await stopIpfs(ipfsd)
    })

    it('creates and opens a database', async () => {
      db = await orbitdb.create(dbname, SetStore.type, { replicate: false })
      assert.strict.equal(db.type, SetStore.type)
      assert.strict.equal(db.dbname, dbname)
      assert.strict.equal(db.address.toString(), dbAddr.toString())
      await db.drop()
    })

    it('static .type returns store type', async () => {
      assert.strict.equal(SetStore.type, 'set')
    })

    it('load entries', async () => {
      const options = {
        replicate: false,
        maxHistory: 0,
        path: dbPath
      }
      db = await orbitdb.open(dbAddr, options)
      await db.load()
      await db.add('asdf')
      await db.close()

      db = await orbitdb.open(dbAddr, options)
      await db.load()
      assert.strict.equal(db.has('asdf'), true)
      await db.drop()
    })

    describe('Set Store Instance', function () {
      const meta = { yo: 123 }

      beforeEach(async () => {
        const options = {
          replicate: false,
          maxHistory: 0,
          path: dbPath
        }
        db = await orbitdb.open(dbAddr, options)
      })

      afterEach(async () => {
        await db.drop()
      })

      it('.add insert value to set', async function () {
        assert.strict.deepEqual([...db.values()], [])
        await db.add(1, { meta })
        await db.add(2)
        await db.add(3)
        await db.add(4)
        assert.strict.deepEqual([...db.values()], [4, 3, 2, 1])
        await db.add(1)
        await db.add(2)
        await db.add(3)
        await db.add(4)
        assert.strict.deepEqual([...db.values()], [4, 3, 2, 1])
        assert.strict.deepEqual(db._oplog.values[0].payload.meta, meta)
      })

      it('.delete remove value from set', async function () {
        assert.strict.deepEqual([...db.values()], [])
        await db.delete(3, { meta })
        await db.add(1)
        await db.add(2)
        await db.add(3)
        assert.strict.deepEqual([...db.values()], [3, 2, 1])
        await db.add(1)
        await db.add(2)
        await db.add(3)
        await db.delete(3)
        assert.strict.deepEqual([...db.values()], [2, 1])
        assert.strict.deepEqual(db._oplog.values[0].payload.meta, meta)
      })

      it('.clear remove all values from set', async function () {
        assert.strict.deepEqual([...db.values()], [])
        await db.clear({ meta })
        await db.add(1)
        await db.add(2)
        await db.add(3)
        assert.strict.deepEqual([...db.values()], [3, 2, 1])
        await db.add(1)
        await db.add(2)
        await db.add(3)
        await db.clear()
        assert.strict.deepEqual([...db.values()], [])
        assert.strict.deepEqual(db._oplog.values[0].payload.meta, meta)
      })

      it('.size mirrors set.size', async function () {
        assert.strict.equal(db.size, db.index.size)
      })

      it('.entries mirrors set.entries', async function () {
        assert.strict.deepEqual(db.entries(), db.index.entries())
      })

      it('.forEach mirrors set.forEach', async function () {
        const a = []
        const b = []
        await db.add(1)
        await db.add(2)
        await db.add(3)
        const push = (array) => (a, b, c) => array.push({ a, b, c })
        db.forEach(push(a))
        db.index.forEach(push(b))
        assert.strict.deepEqual(a, b)
      })

      it('.has mirrors set.has', async function () {
        assert.strict.equal(db.has(), db.index.has())
      })

      it('.keys mirrors set.keys', async function () {
        assert.strict.deepEqual(db.keys(), db.index.keys())
      })

      it('.values mirrors set.values', async function () {
        assert.strict.deepEqual(db.values(), db.index.values())
      })
    })
  })
})
