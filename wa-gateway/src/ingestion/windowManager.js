require('dotenv').config();
const redisClient = require('../clients/redisClient');
const { processWindow } = require('./heuristicFilter');
const { classifyWindow } = require('../clients/aiServiceClient')
const { sendReminder } = require('./reminderSender');

const WINDOW_TIMEOUT_MS = 30 * 1000; // changed for debug 
const ACTIVE_WINDOW_KEY = 'active_windows'; 
const WA_NUMBER = process.env.WA_NUMBER

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

function startWindowTicker(sock, intervalMs = 30000) { 
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
                    
                    const chatHistory = await getWindowMessages(chatId, parseInt(meta.startTime || now) - 1000, now);
                    const durationMin = ((now - parseInt(meta.startTime || now)) / 60000).toFixed(1);
                    
                    console.log(`[Window closed] chatId: ${chatId}. Active duration: ${durationMin} min.`);

                    await redisClient.zRem(ACTIVE_WINDOW_KEY, chatId);
                    await redisClient.del(metaKey);
                    await redisClient.del(`chat:${chatId}`);
                    
                    if (processWindow(chatHistory)) {
                        console.log(`[Window valid] chatId: ${chatId}. Active duration: ${durationMin} min.`); 

                        const aiPayload = {
                            window_id: chatId + "_" + Date.now(), 
                            is_reply_chain: false,
                            messages: chatHistory.map(msg => ({
                                message_id: msg.id || '',       
                                sender: msg.sender || '',
                                text: msg.text || '',
                                timestamp: new Date(msg.timestamp || Date.now()).toISOString(),
                                is_quoted_reply_to: msg.parentMsgId || null 
                            }))
                        };
                        
                        console.log(`[AI Payload Ready]:`, JSON.stringify(aiPayload, null, 2));
                        try {
                            const aiResponse = await classifyWindow(aiPayload);
                            console.log('[AI Response Received]:', JSON.stringify(aiResponse, null, 2));

                            if (aiResponse.is_important) {
                                await sendReminder(sock, WA_NUMBER, aiResponse);
                            }
                        } catch (aiError){
                            console.error(`[AI Processing Error]:`, aiError.message);
                        }
                    } else {
                        console.log(`[Window filtered] chatId: ${chatId}. Active duration: ${durationMin} min.`); 
                    }
                }
            }
        } catch (err) {
            console.error('[Window Ticker Error] ', err);
        }
    }, intervalMs);
}

async function getWindowMessages(chatId, start, end) {
    const messages = await redisClient.zRangeByScore(`chat:${chatId}`, start, end);
    return messages.map(msg => JSON.parse(msg));
}

module.exports = { handleWindowActivity, startWindowTicker };