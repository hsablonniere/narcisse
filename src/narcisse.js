'use strict'

const path = require('path')
const projectRoot = path.resolve(__dirname, '..')

const conf = require('./config')
const googleSearch = require('./google-search')
const initDatabase = require('./database')
const PushBullet = require('pushbullet')
const url = require('url')
const winston = require('winston')

const pkg = require(path.resolve(projectRoot, 'package.json'))

try {
  conf.validate({ allowed: 'strict' })
  winston.info(`${pkg.name}@${pkg.version}`)
  winston.info(`SEARCH_QUERIES:   ${conf.get('SEARCH_QUERIES').join(',')}`)
  winston.info(`UNWANTED_DOMAINS: ${conf.get('UNWANTED_DOMAINS').join(',')}`)
  winston.info(`DATABASE_PATH:    ${conf.get('DATABASE_PATH')}`)
}
catch (error) {
  const configErrorMessages = error.message.split('\n')
  configErrorMessages.forEach((message) => {
    winston.error('Bad config -', message)
  })

  // 9 - Invalid Argument
  // https://nodejs.org/api/process.html#process_exit_codes
  winston.error('narcisse STOPPED because of configuration errors.')
  process.exit(9)
}

const absoluteDatabasePath = path.resolve(projectRoot, conf.get('DATABASE_PATH'))
const linksDb = initDatabase(absoluteDatabasePath)
const pusher = new PushBullet(conf.get('PUSH_BULLET_ACCESS_TOKEN'))

function run () {

  winston.info(`-- START: Let's find some links!`)

  const allSearches = conf.get('SEARCH_QUERIES')
    .map((query) => googleSearch(query))

  Promise.all(allSearches)
    .then((allGroupedResults) => {

      const links = allGroupedResults.reduce((a, b) => [...a, ...b], [])
      const usefulLinks = links.filter((link) => {
        const { host } = url.parse(link.url)
        return !conf.get('UNWANTED_DOMAINS').includes(host)
      })
      const newLinks = usefulLinks.filter((link) => linksDb.exists(link))

      winston.info(`-- Found ${links.length} links on the Web`)
      winston.info(`---- ${usefulLinks.length} interesting`)
      winston.info(`---- ${newLinks.length} new`)

      newLinks.forEach((link) => {

        winston.info(`.. adding link to DB    ${link.url}`)
        linksDb.add(link)

        winston.info(`.. pushing notification ${link.url}`)
        const pushNoteText = `${link.text}\n${link.url}`
        pusher.note(null, `Narcisse [${link.searchQuery}]`, pushNoteText, (err) => {
          if (err) winston.log(err)
        })
      })

      winston.info(`-- DONE! There are ${linksDb.size()} links in the DB now`)
    })
    .catch((e) => winston.error(e))
}

run()
