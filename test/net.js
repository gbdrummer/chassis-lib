'use strict'

var test = require('tape')
var pkg = require('../package.json')

test('NGN.NET', function (t) {
  t.ok(NGN.hasOwnProperty('NET'), 'NGN.NET is available.')
  t.ok(typeof NGN.NET.Resource === 'function', 'NGN.NET.Resource is available.')
  t.ok(typeof NGN.NET.xhr === 'function', 'NGN.NET.xhr is a valid method.')
  t.ok(typeof NGN.NET.run === 'function', 'NGN.NET.run is a valid method.')
  t.ok(typeof NGN.NET.runSync === 'function', 'NGN.NET.runSync is a valid method.')
  t.ok(typeof NGN.NET.domainRoot === 'function', 'NGN.NET.domainRoot is a valid method.')
  t.ok(typeof NGN.NET.isCrossOrigin === 'function', 'NGN.NET.isCrossOrigin is a valid method.')
  t.ok(typeof NGN.NET.prelink === 'function', 'NGN.NET.prelink is a valid method.')
  t.ok(typeof NGN.NET.send === 'function', 'NGN.NET.send is a valid method.')
  t.ok(typeof NGN.NET.get === 'function', 'NGN.NET.get is a valid method.')
  t.ok(typeof NGN.NET.getSync === 'function', 'NGN.NET.getSync is a valid method.')
  t.ok(typeof NGN.NET.head === 'function', 'NGN.NET.head is a valid method.')
  t.ok(typeof NGN.NET.headSync === 'function', 'NGN.NET.headSync is a valid method.')
  t.ok(typeof NGN.NET.put === 'function', 'NGN.NET.put is a valid method.')
  t.ok(typeof NGN.NET.putSync === 'function', 'NGN.NET.putSync is a valid method.')
  t.ok(typeof NGN.NET.post === 'function', 'NGN.NET.post is a valid method.')
  t.ok(typeof NGN.NET.postSync === 'function', 'NGN.NET.postSync is a valid method.')
  t.ok(typeof NGN.NET.delete === 'function', 'NGN.NET.delete is a valid method.')
  t.ok(typeof NGN.NET.deleteSync === 'function', 'NGN.NET.deleteSync is a valid method.')
  t.ok(typeof NGN.NET.json === 'function', 'NGN.NET.json is a valid method.')
  t.ok(typeof NGN.NET.jsonSync === 'function', 'NGN.NET.jsonSync is a valid method.')
  t.ok(typeof NGN.NET.import === 'function', 'NGN.NET.import is a valid method.')
  t.ok(typeof NGN.NET.importTo === 'function', 'NGN.NET.importTo is a valid method.')
  t.ok(typeof NGN.NET.importBefore === 'function', 'NGN.NET.importBefore is a valid method.')
  t.ok(typeof NGN.NET.importAfter === 'function', 'NGN.NET.importAfter is a valid method.')
  t.ok(typeof NGN.NET.fetchRemoteFile === 'function', 'NGN.NET.fetchRemoteFile is a valid method.')
  t.ok(typeof NGN.NET.getFileExtension === 'function', 'NGN.NET.getFileExtension is a valid method.')
  t.ok(typeof NGN.NET.predns === 'function', 'NGN.NET.predns is a valid method.')
  t.ok(typeof NGN.NET.preconnect === 'function', 'NGN.NET.preconnect is a valid method.')
  t.ok(typeof NGN.NET.prefetch === 'function', 'NGN.NET.prefetch is a valid method.')
  t.ok(typeof NGN.NET.prerender === 'function', 'NGN.NET.prerender is a valid method.')
  t.ok(typeof NGN.NET.subresource === 'function', 'NGN.NET.subresource is a valid method.')
  t.ok(typeof NGN.NET.template === 'function', 'NGN.NET.template is a valid method.')
  t.end()
})

var uri = function (route) {
  return pkg.mocky[route]
  // return 'http://127.0.0.1:9877' + route
}

test('NGN.NET Basic Web Requests', function (t) {
  NGN.NET.get(uri('get'), function (gres) {
    t.ok(gres instanceof XMLHttpRequest, 'Basic GET method provides a response.')

    // JSON test cannot run because Karma does not pass results back from requests.
    // It only returns the base XMLHttpRequest object as a placeholder.
    // NGN.NET.json(uri('/net'), function (jres) {
      // t.ok(jres instanceof XMLHttpRequest, 'Basic JSON GET method provides a response.')
    NGN.NET.post({
      url: uri('post'),
      json: {test: true}
    }, function (pres) {
      t.ok(pres instanceof XMLHttpRequest, 'Basic POST method provides a response.')

      NGN.NET.put({
        url: uri('put'),
        json: {test: true}
      }, function (mres) {
        t.ok(mres instanceof XMLHttpRequest, 'Basic PUT method provides a response.')

        NGN.NET.delete(uri('del'), function (dres) {
          t.ok(dres instanceof XMLHttpRequest, 'Basic DELETE method provides a response.')

          NGN.NET.head(uri('head'), function (hres) {
            t.ok(hres instanceof XMLHttpRequest, 'Basic HEAD method provides a response.')
            t.ok(NGN.NET.normalizeUrl('http:////mydomain.com/test/../testing') === 'http://mydomain.com/testing', 'Domain normalization works.')
            t.ok(NGN.NET.domainRoot('https://mydomain.com/path/to/thing') === 'mydomain.com', 'Domain root detected.')
            t.ok(NGN.NET.isCrossOrigin('https://google.com'), 'Detect cross-origin domains.')

            NGN.NET.preconnect('https://google.com')
            t.ok(document.querySelector('link[href="https://google.com"][rel="preconnect"][crossorigin="true"]') !== null, 'Preconnect a linked reference.')

            NGN.NET.predns('google.com')
            t.ok(document.querySelector('link[href="http://google.com"][rel="dns-prefetch"][crossorigin="true"]') !== null, 'Predns does a DNS handshake.')

            NGN.NET.subresource('https://google.com')
            t.ok(document.querySelector('link[href="https://google.com"][rel="subresource"][crossorigin="true"]') !== null, 'Subresource successfully established.')

            NGN.NET.prerender('https://google.com')
            t.ok(document.querySelector('link[href="https://google.com"][rel="prerender"][crossorigin="true"]') !== null, 'Prerender an entire page.')

            t.end()
          })
        })
      })
    })
    // })
  })
})

test('NGN.NET Basic Web Requests (Synchronous)', function (t) {
  var gres = NGN.NET.getSync(uri('getsync'))
  t.ok(gres instanceof XMLHttpRequest, 'Basic synchronous GET method provides a response.')

  var pres = NGN.NET.postSync({
    url: uri('postsync'),
    json: {test: true}
  })
  t.ok(pres instanceof XMLHttpRequest, 'Basic synchronous POST method provides a response.')

  var mres = NGN.NET.putSync({
    url: uri('putsync'),
    json: {test: true}
  })
  t.ok(mres instanceof XMLHttpRequest, 'Basic synchronous PUT method provides a response.')

  var dres = NGN.NET.deleteSync(uri('delsync'))
  t.ok(dres instanceof XMLHttpRequest, 'Basic synchronous DELETE method provides a response.')

  var hres = NGN.NET.headSync(uri('headsync'))
  t.ok(hres instanceof XMLHttpRequest, 'Basic synchronous HEAD method provides a response.')

  t.end()
})

test('Network Imports', function (t) {
  try {
    if (Request !== undefined) {
      NGN.NET.import('https://cdn.rawgit.com/gilbarbara/logos/master/logos/git.svg', function (content) {
        t.ok(content !== null && content !== undefined && !(content instanceof Error), 'Content successfully retrieved via fetch.')
        t.end()
      })
    } else {
      t.skip('Skip testing fetch for browsers that don\'t yet support it.')
      t.end()
    }
  } catch (e) {
    t.skip('Skip testing fetch for browsers that don\'t yet support it.')
    t.end()
  }
})

// test('NGN.NET.Resource', function (t) {
//   var API = new NGN.NET.Resource({
//     baseUrl: 'http://domain.com'
//   })
// })
