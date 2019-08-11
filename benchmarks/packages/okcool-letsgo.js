'use strict'

const { title, now, print, operations } = require('../utils')
const OkCoolLetsGo = require('../../../okcool-letsgo')

var router = new OkCoolLetsGo()

title('okcool-letsgo benchmark')

const routes = [
  { method: 'POST',  url: '/user' },
  { method: 'POST',  url: '/user/comments' },
  { method: 'POST',  url: '/user/avatar' },
  { method: 'POST',  url: '/user/lookup/username/:username' },
  { method: 'POST',  url: '/user/lookup/email/:address' },
  { method: 'POST',  url: '/event/:id' },
  { method: 'POST',  url: '/event/:id/comments' },
  { method: 'POST',  url: '/event/:id/comment' },
  { method: 'POST',  url: '/map/:location/events' },
  { method: 'POST',  url: '/status' },
  { method: 'POST',  url: '/very/deeply/nested/route/hello/there' }
  //{ method:   url: '/static/*' }
]

function noop () {}
var i = 0
var time = 0

routes.forEach(route => {
  router.add(route.url, noop)
})

time = now()
for (i = 0; i < operations; i++) {
  router.find(  '/user')
}
print('short static:', time)

time = now()
for (i = 0; i < operations; i++) {
  router.find(  '/user/comments')
}
print('static with same radix:', time)

time = now()
for (i = 0; i < operations; i++) {
  router.find(  '/user/lookup/username/john')
}
print('dynamic route:', time)

time = now()
for (i = 0; i < operations; i++) {
  router.find(  '/event/abcd1234/comments')
}
print('mixed static dynamic:', time)

time = now()
for (i = 0; i < operations; i++) {
  router.find(  '/very/deeply/nested/route/hello/there')
}
print('long static:', time)

//time = now()
//for (i = 0; i < operations; i++) {
//  router.find(  '/static/index.html')
//}
//print('wildcard:', time)

time = now()
for (i = 0; i < operations; i++) {
  router.find('/user')
  router.find(  '/user/comments')
  router.find(  '/user/lookup/username/john')
  router.find(  '/event/abcd1234/comments')
  router.find(  '/very/deeply/nested/route/hello/there')
  //router.find(  '/static/index.html')
}
print('all together:', time)
