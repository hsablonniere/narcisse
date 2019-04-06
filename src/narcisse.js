'use strict'

const path = require('path')
const projectRoot = path.resolve(__dirname, '..')

const conf = require('./config')
const googleSearch = require('./google-search')
const { noUnwantedDomains, noSpam } = require('./filter-links')
const initDatabase = require('./database')
const { getPusher } = require('./pushbullet')
const url = require('url')
const { getRealUrl } = require('./get-real-url')
const winston = require('winston')

const pkg = require(path.resolve(projectRoot, 'package.json'))
const logger = winston.createLogger({
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
})

try {
  conf.validate({ allowed: 'strict' })
  logger.info(`${pkg.name}@${pkg.version}`)
  logger.info(`SEARCH_QUERIES:   ${conf.get('SEARCH_QUERIES').join(',')}`)
  logger.info(`UNWANTED_DOMAINS: ${conf.get('UNWANTED_DOMAINS').join(',')}`)
  logger.info(`DATABASE_PATH:    ${conf.get('DATABASE_PATH')}`)
} catch (error) {
  const configErrorMessages = error.message.split('\n')
  configErrorMessages.forEach((message) => {
    logger.error(`Bad config - ${message}`)
  })

  // 9 - Invalid Argument
  // https://nodejs.org/api/process.html#process_exit_codes
  logger.error('narcisse STOPPED because of configuration errors.')
  process.exit(9)
}

const absoluteDatabasePath = path.resolve(projectRoot, conf.get('DATABASE_PATH'))
const linksDb = initDatabase(absoluteDatabasePath)

const pushNote = getPusher(conf.get('PUSH_BULLET_ACCESS_TOKEN'))

async function run () {

  logger.info(`-- START: Let's find some links!`)

  const allSearches = conf.get('SEARCH_QUERIES')
    .map((query) => googleSearch(query))

  const allGroupedResults = await Promise.all(allSearches)

  const allLinks = allGroupedResults.reduce((a, b) => [...a, ...b], [])
  const goodDomainsLinks = allLinks.filter(noUnwantedDomains(conf.get('UNWANTED_DOMAINS')))
  const noSpamLinks = goodDomainsLinks.filter(noSpam())
  const newLinks = noSpamLinks.filter((link) => linksDb.exists(link))

  logger.info(`-- Found ${allLinks.length} links on the Web`)
  logger.info(`---- ${goodDomainsLinks.length} interesting`)
  logger.info(`---- ${newLinks.length} new`)

  for (let link of newLinks) {

    const realUrl = await getRealUrl(link.url)

    logger.info(`.. adding link to DB    ${realUrl}`)
    linksDb.add(link)

    logger.info(`.. pushing notification ${realUrl}`)
    const pushNoteText = `${link.text}\n${realUrl}`
    await pushNote(`Narcisse [${link.searchQuery}]`, pushNoteText)
      .catch((err) => logger.log(err))
  }

  logger.info(`-- DONE! There are ${linksDb.size()} links in the DB now`)
}

run()
  .then(console.log)
  .catch(console.error)
