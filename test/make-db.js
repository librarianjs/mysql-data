'use strict'

var MYSQL_PASSWORD = 'testpassword'
var MYSQL_CONTAINER = 'librarian_test'
var MYSQL_TABLE = 'files'
var MYSQL_SCHEMA = require('fs').readFileSync(__dirname + '/schema.sql')

var execSync = require('child_process').execSync

function exec (command, env) {
  env = env || {}
  return execSync(command, {env}).toString()
}

function startDb(){
  var running =  exec(`docker inspect -f "{{.State.Running}}" ${MYSQL_CONTAINER} 2> /dev/null || :`).trim()
  if(running !== 'true') {
    exec(`docker run -d -P --name ${MYSQL_CONTAINER} -e MYSQL_ROOT_PASSWORD=${MYSQL_PASSWORD} mysql`)
  }

  var port = exec(`docker inspect -f '{{(index (index .NetworkSettings.Ports "3306/tcp") 0).HostPort}}' ${MYSQL_CONTAINER}`).trim()
  let connectionDetails = {
    host: '127.0.0.1',
    port: port,
    user: 'root',
    password: MYSQL_PASSWORD,
    database: MYSQL_CONTAINER,
    table: MYSQL_TABLE
  }
  return connectionDetails
}
function stopDb(){
  return // don't do any cleanup right now, it makes the tests start much faster on the 2nd run.
  exec(`docker rm -f ${MYSQL_CONTAINER} 2> /dev/null || :`)
}

startDb.stop = stopDb

module.exports = startDb
