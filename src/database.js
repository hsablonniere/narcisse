'use strict'

const FileSync = require('lowdb/adapters/FileSync')
const low = require('lowdb')
const { ensureFileSync } = require('fs-extra')

function initDatabase (databasePath) {

  ensureFileSync(databasePath)
  const adapter = new FileSync(databasePath)
  const database = low(adapter)

  // Set some defaults in database
  database
    .defaults({ links: [] })
    .write()

  return {
    exists (link) {
      return database.get('links').find({ url: link.url }).value() == null
    },
    add (link) {
      database
        .get('links')
        .push(link)
        .write()
    },
    size () {
      return database
        .get('links')
        .size()
        .value()
    },
  }
}

module.exports = initDatabase
