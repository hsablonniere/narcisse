'use strict'

const convict = require('convict')

const conf = convict({
  SEARCH_QUERIES: {
    doc: 'The strings to search on the internet.',
    format: Array,
    default: ['narcisse'],
    env: 'SEARCH_QUERIES',
  },
  UNWANTED_DOMAINS: {
    doc: 'The domains to ignore.',
    format: Array,
    default: ['google.com'],
    env: 'UNWANTED_DOMAINS',
  },
  PUSH_BULLET_ACCESS_TOKEN: {
    doc: 'The access token to send pushes with Pushbullet.',
    format: String,
    default: null,
    env: 'PUSH_BULLET_ACCESS_TOKEN',
  },
  DATABASE_PATH: {
    doc: 'The flat database path.',
    format: String,
    default: null,
    env: 'DATABASE_PATH',
  },
})

module.exports = conf
