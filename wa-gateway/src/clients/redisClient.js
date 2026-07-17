const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('[Redis Client Error]', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

(async () => {
    try {
        await redisClient.connect();
        await redisClient.flushAll();
    } catch {
        console.error('Redis Client Error: ', err);
    }
})();

module.exports = redisClient;