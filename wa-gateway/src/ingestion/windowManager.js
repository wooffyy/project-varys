const redisClient = require('../clients/redisClient');

const WINDOW_TIMEOUT_MS = 10 * 60 * 1000; 
const ACTIVE_WINDOW_KEY = 'active_windows'; 

async function handleWindowActivity(chatId, isReply){
    if (isReply) return;

    const metaKey = `window_meta:${chatId}`;
    const score = await redisClient.zScore(ACTIVE_WINDOW_KEY, chatId);

    if (score === null) {
        const startTime = Date.now();
        await redisClient.hSet(
            metaKey,
            {
                startTime: startTime.toString(),
                chatId: chatId
            } 
        );
        console.log(`[Window opened] chatId: ${chatId} startTime: ${startTime}`);
    } else {
        console.log(`[Window updated] chatId: ${chatId}`);
    }

    await redisClient.zAdd(ACTIVE_WINDOW_KEY, {
        score: Date.now(),
        value: chatId
    });
}

function startWindowTicker(intervalMs = 30000) { 
    console.log(`[Window Ticker] Scheduler active for ${intervalMs / 1000} sec.`);

    setInterval(async () => {
        const now = Date.now();
        const cutoff = now - WINDOW_TIMEOUT_MS;

        try {
            const expiredChats = await redisClient.zRange(ACTIVE_WINDOW_KEY, '-inf', cutoff, { BY: 'SCORE' });

            if (expiredChats.length > 0) {
                for (const chatId of expiredChats) {
                    const metaKey = `window_meta:${chatId}`;
                    const meta = await redisClient.hGetAll(metaKey);
                    
                    const durationMin = ((now - parseInt(meta.startTime || now)) / 60000).toFixed(1);
                    
                    console.log(`[Window closed] chatId: ${chatId}. Active duration: ${durationMin} min.`);
                    
                    await redisClient.zRem(ACTIVE_WINDOW_KEY, chatId);
                    await redisClient.del(metaKey);
                }
            }
        } catch (err) {
            console.error('[Window Ticker Error] ', err);
        }
    }, intervalMs);
}

module.exports = { handleWindowActivity, startWindowTicker };