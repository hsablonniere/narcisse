'use strict'

const PushBullet = require('pushbullet')

function getPusher (accessToken) {

  const pusher = new PushBullet(accessToken)

  return (title, text) => {
    return new Promise((resolve, reject) => {
      pusher.note(null, title, text, (err) => {
        if (err) {
          reject(err)
        }
        else {
          resolve()
        }
      })
    })
  }
}

module.exports = {
  getPusher,
}
