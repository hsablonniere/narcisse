'use strict'

const URL = require('url').URL

function noUnwantedDomains (unwantedDomains) {
  return (link) => {
    const linkUrl = new URL(link.url)
    return !unwantedDomains.includes(linkUrl.host)
  }
}

const SPAM_PATHNAME_REGEX = /^\/[a-z0-9]{7,10}\/[a-z0-9]{7,10}\.php$/
const SPAM_QUERYPARAM_REGEX = /^[a-z0-9]{7,10}$/

function noSpam () {
  return (link) => {
    const linkUrl = new URL(link.url)
    const hasSpamPathname = SPAM_PATHNAME_REGEX.test(linkUrl.pathname)
    const hasSpamParams = Array
      .from(linkUrl.searchParams.keys())
      .some((param) => SPAM_QUERYPARAM_REGEX.test(param))
    return (hasSpamPathname && hasSpamParams) ? false : true
  }
}

module.exports = {
  noUnwantedDomains,
  noSpam,
}
