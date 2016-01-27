const makeDb = require( './make-db.js' )
const assert = require('assert')
const MysqlData = require('../')

const TEST_KEY = 'test-key'
const FAKE_KEY = 'fake-key'

describe('MysqlData', function(){
  var record = {
    id: TEST_KEY,
    name: 'cats.png',
    size: 4444,
    mimeType: 'image/png'
  }

  var db = makeDb()
  var plugin = new MysqlData({
    host: db.host,
    user: db.user,
    password: db.password,
    port: db.port,
    database: db.database,
    connectTimeout: 60 * 1000,
    writeSchema: true
  })

  it('should init() successfully', function () {
    this.timeout(60 * 1000)
    return plugin.init()
  })

  it('should put() successfully', function () {
    this.timeout(5000)
    return plugin.put(record)
  })

  it('should get() successfully', function () {
    this.timeout(5000)
    return plugin.get(TEST_KEY).then(fetched => {
      assert.deepEqual(record, fetched)
    })
  })

  it('should getAll() successfully', () => {
    return plugin.getAll().then(fetched => {
      assert(Array.isArray(fetched), 'Returned data is not in array form')
      assert(typeof fetched[0] !== 'object', 'Returned records are objects')
    })
  })

  it('should return null for a missing key', () => {
    return plugin.get(FAKE_KEY).then(data => {
      assert.equal(data, null)
    })
  })
})
