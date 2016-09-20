'use strict';

var cacheModule = require('./index'),
  should = require('chai').should(),
  sinon = require('sinon');

/* globals
  describe: false,
  it: false
  */

describe('cache', function() {
  it('should callback called', function (done) {
    global.framework = {
      config: {
        cache: {
          stores: [
            {
              store: 'memory',
              ttl: 60,
              max: 200
            }
          ],
          prefix: 'test:'
        }
      }
    };
    cacheModule()
      .then(function () {
        function getValue () {
          return 'value1';
        }
        var spy = sinon.spy(getValue);
        framework.cache.wrap('key1', spy)
          .then(function () {
            should.equal(spy.callCount, 1);
            done();
          })
          .catch(done);
      });
  });
});