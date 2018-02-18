'use strict'

const { promisify } = require('util')
const _google = require('google')
const google = promisify(_google)

_google.lang = 'fr'
_google.tld = 'fr'
_google.nextText = 'Suivant'
_google.timeSpan = 'w'
_google.resultsPerPage = 100
_google.noQuotesText = 'sans guillemets'

module.exports = async function (searchQuery) {

  const { body, links } = await google(searchQuery)

  // only strict results
  if (body.includes(_google.noQuotesText)) {
    return []
  }

  return links
    .filter((link) => link.href != null)
    .map((link) => {
      return ({
        text: link.title,
        url: link.href,
        searchQuery,
        createdAt: new Date().getTime(),
      })
    })
}
