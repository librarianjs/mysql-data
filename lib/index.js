'use strict'

const DEFAULT_RETRY_WAIT_TIME = 1000
const DEFAULT_CONNECT_TIMEOUT = 45 * DEFAULT_RETRY_WAIT_TIME
const RECOVERABLE_ERRORS = ['PROTOCOL_CONNECTION_LOST', 'ECONNREFUSED']

const Bluebird = require('bluebird')
Bluebird.promisifyAll(require("mysql/lib/Connection").prototype)
Bluebird.promisifyAll(require("mysql/lib/Pool").prototype)

const mysql = require('mysql')
const merge = require('lodash.merge')

function wait (time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

class MysqlData {
  constructor (options) {
    this.options = options = merge({
      connectTimeout: DEFAULT_CONNECT_TIMEOUT,
      retryWaitTime: DEFAULT_RETRY_WAIT_TIME,
      host: 'localhost',
      port: 3306,
      database: 'librarian',
      user: 'librarian',
      table: 'files',
      writeSchema: false
    }, options)

    if(this.options.password === undefined){
      throw new Error('librarian-mysql-data password has not been provided')
    }

    this.FIND_ALL_SQL =
      `SELECT id
       FROM ${this.options.database}.${this.options.table}`

    this.FIND_ONE_SQL =
      `SELECT id, name, size, mimeType
       FROM ${this.options.database}.${this.options.table}
       WHERE id = ?`

    this.INSERT_RECORD_SQL =
      `INSERT INTO ${this.options.database}.${this.options.table} (id, name, size, mimeType)
       VALUES (?, ?, ?, ?)`

    this.TEST_FOR_DATABASE_SQL =
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`

    this.TEST_FOR_TABLE_SQL = [
      `USE ${this.options.database}`,
      `SHOW TABLES LIKE '${this.options.table}'`
    ]

    this.WRITE_SCHEMA_SQL = [
      `CREATE DATABASE IF NOT EXISTS ${this.options.database}`,
      `CREATE TABLE IF NOT EXISTS ${this.options.database}.${this.options.table} (
        id CHAR(36),
        name VARCHAR(128),
        mimeType VARCHAR(64),
        size INT
      )`
    ]
  }

  init () {
    return this._waitForConnection().then(() => {
      if (this.options.writeSchema) {
        return this._writeSchema()
      }
    }).then(() => {
      return this._ensureDatabaseExists()
    }).then(() => {
      return this._ensureTableExists()
    })
  }

  get (id) {
    let conn
    return this._connection().then(c => {
      conn = c
    }).then(() => {
      return conn.queryAsync(this.FIND_ONE_SQL, [id])
    }).then(records => {
      conn.end()
      records = records[0]
      if (records.length) {
        return records[0]
      } else {
        return null
      }
    })
  }

  getAll () {
    return this._connection().then(conn => {
      return conn.queryAsync(this.FIND_ALL_SQL).then(records => {
        conn.end()
        return records[0].map(record => record.id)
      })
    })
  }

  put  (data) {
    return this._connection().then(conn => {
      return conn.queryAsync(this.INSERT_RECORD_SQL, [
        data.id || null,
        data.name || null,
        data.size || null,
        data.mimeType || null
      ]).then(() => {
        conn.end()
      })
    })
  }

  _connection (withoutDB) {
    let connectionDetails = {
      host: this.options.host,
      port: this.options.port,
      user: this.options.user,
      password: this.options.password,
      database: this.options.database
    }

    if (withoutDB) {
      delete connectionDetails.database
    }

    let conn = mysql.createConnection(connectionDetails)

    return new Promise((resolve, reject) => {
      conn.connect(err => {
        if (err) {
          reject(err)
        } else {
          resolve(conn)
        }
      })
    })
  }

  _waitForConnection (tick) {
    tick = tick || 1

    return this._connection(true).catch(err => {
      if (RECOVERABLE_ERRORS.indexOf(err.code) !== -1) {
        if (tick * this.options.retryWaitTime < this.options.connectTimeout) {
          return wait(this.options.retryWaitTime).then(() => this._waitForConnection(tick + 1))
        }
      }

      return Promise.reject(new Error(`Could not connect to database (${err.code})`))
    })
  }

  _writeSchema () {
    let conn
    return this._connection(true).then(c => {
      conn = c
    }).then(() => {
      return conn.queryAsync(this.WRITE_SCHEMA_SQL[0])
    }).then(() => {
      return conn.queryAsync(this.WRITE_SCHEMA_SQL[1])
    }).then(data => {
      conn.end()
    })
  }

  _ensureDatabaseExists () {
    return this._connection().then(conn => {
      return conn.queryAsync(this.TEST_FOR_DATABASE_SQL, [this.options.database]).then(records => {
        conn.end()
        if (records[0].length) {
          return Promise.resolve()
        } else {
          return Promise.reject(new Error(`Database ${this.options.database} does not exist`))
        }
      })
    })
  }

  _ensureTableExists () {
    let conn
    return this._connection().then(c => {
      conn = c
    }).then(() => {
      return conn.queryAsync(this.TEST_FOR_TABLE_SQL[0])
    }).then(() => {
      return conn.queryAsync(this.TEST_FOR_TABLE_SQL[1])
    }).then(records => {
      conn.end()
      return records
    }).then(records => {
      if (records[0].length) {
        return Promise.resolve()
      } else {
        return Promise.reject(new Error(`Table ${this.options.table} does not exist`))
      }
    })
  }
}

module.exports = MysqlData
