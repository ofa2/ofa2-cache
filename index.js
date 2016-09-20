'use strict';

/*
module.exports.cache = {
  stores: [
    {
      store: 'memory',
      ttl: 60,
      max: 200
    },
    {
      expose: 'redis',
      store: 'cache-manager-redis',
      connection: 'redisCache'
    }
  ],
  prefix: 'mlop-cache:PlatformPoiImportWorker:'
};
*/
var _ = require('lodash'),
  cacheManager = require('cache-manager'),
  Promise = require('bluebird');

var exposeCaches = {};
function initCache() {
  var caches = _.map(framework.config.cache.caches, function (cacheConfig) {
    var cache;
    if(cacheConfig.store === 'memory') {
      cache = cacheManager.caching(cacheConfig);
    }
    else {
      var connectionConfig = framework.config.connections[cacheConfig.connection];
      if(cacheConfig.connection && !connectionConfig) {
        throw new Error('undefined connection ' + cacheConfig.connection);
      }
      cache = cacheManager.caching(_.extend({store: require(cacheConfig.store)}, connectionConfig));
      if(cacheConfig.error) {
        cache.store.events.on(cacheConfig.error, function (error) {
          // handle error here
          logger.error(error);
        });
      }

    }
    if(cacheConfig.expose) {
      exposeCaches[cacheConfig.expose] = cache;
    }
    return cache;
  });

  return cacheManager.multiCaching(caches);
}

function CacheWrapperPrefixer (fn) {
  return function () {
    arguments[0] = this.prefix + arguments[0];
    return this.cache[fn].apply(this.cache, Array.prototype.slice.call(arguments, 0));
  };
}

function CacheWrapper (cache, prefix) {
  this.cache = cache;
  this.prefix = prefix;
}

CacheWrapper.prototype.wrap = CacheWrapperPrefixer('wrap');
CacheWrapper.prototype.get = CacheWrapperPrefixer('get');
CacheWrapper.prototype.set = CacheWrapperPrefixer('set');
CacheWrapper.prototype.del = CacheWrapperPrefixer('del');

function lift (done) {
  var multiCache = initCache();
  var prefix = framework.config.cache.prefix;

  var result = new CacheWrapper(multiCache, prefix);
  for(var key in exposeCaches) {
    result[key] = new CacheWrapper(exposeCaches[key], prefix);
  }

  framework.cache = result;
  done();
}

module.exports = Promise.promisify(lift);
