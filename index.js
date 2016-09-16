
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
      store: 'redis',
      connection: 'redisCache'
    }
  ],
  prefix: 'mlop-cache:PlatformPoiImportWorker:'
};
*/
var _ = require('lodash'),
  cacheManager = require('cache-manager'),
  Promise = require('bluebird');

function initCache() {

  var caches = _.map(framework.config.cache.caches, function (cacheConfig) {
    if(cacheConfig.store === 'memory') {
      return cacheManager.caching(cacheConfig);
    }
    var connectionConfig = framework.config.connections[cacheConfig.connection];
    if(cacheConfig.connection && connectionConfig) {
      throw new Error('undefined connection ' + cacheConfig.connection);
    }

    var cache = cacheManager.caching(_.extend({store: require(cacheConfig.store)}, connectionConfig));
    if(cacheConfig.error) {
      cache.store.events.on(cacheConfig.error, function (error) {
        // handle error here
        logger.error(error);
      });
    }
    return cache;
  });

  return cacheManager.multiCaching(caches);
}

function lift (done) {
  var multiCache = initCache();
  var prefix = framework.config.cache.prefix;

  framework.cache = {
    wrap: function (key, callback) {
      return multiCache.wrap(prefix + key, callback);
    }
  };
  done();
}

module.exports = Promise.promisify(lift);
