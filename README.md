# Librarian MySQL Data

## Installation

```
$ npm install librarian-mysql-data
```

## Usage

```js
var express = require('express')
var librarian = require('librarian')
var MysqlData = require('librarian-mysql-data')

var dataPlugin = new MysqlData(options) // see below for options
var app = express()
app.use('/files', librarian({
  data: dataPlugin
}))

app.listen(8888, function(){
  console.log('app listening')
})
```

## Options

Options is an object containing any of the following options.

### host

The host to connect to. Defaults to `localhost`.

### port

The port to connect to. Defaults to `3306`.

### database

The database name. Defaults to `librarian`.

### table

The database table for the file records. If you use the [writeSchema](#writeSchema) option, one will be created for you with this name. But if you already have a table, make sure it has the correct format.

Field | Type | Notes
----- | ---- | -----
id | CHAR(36) | Will store UUIDs
name | VARCHAR(128) | 128 seems reasonable, but you can change this.
size | INT | INT will store up to ~2gb, much larger sizes than librarian is designed to handle.
mimeType | VARCHAR(64) | RFC 6838 [recommends](https://tools.ietf.org/html/rfc6838#section-4.2) a mimeType length of 64 chars. Most common image formats are less than 10.

### user

The user to connect as. Defaults to `librarian`.

### password (required, or connectionString)

The password to use. Use `''` if you don't want a password.

### writeSchema

Should this plugin attempt to create the database/table for you?
If you set this to true, it should fail gracefully if the database/table already exists.

Defaults to `false`.

### connectTimeout

The amount of milliseconds `init()` will wait for MySQL to come online before failing.

Defaults to `45 * 1000` (milliseconds).

### retryWaitTime

The amount of milliseconds `init()` will wait between connection attempts.

Defaults to `1000` (milliseconds).
