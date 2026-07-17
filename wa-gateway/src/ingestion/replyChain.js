const redisClient = require('../clients/redisClient');

const MSG_TTL_SECONDS = 30 * 24 * 60 * 60;

async function saveMessage(msgId, msgData) {
    const key = `msg:${msgId}`;
    const value = JSON.stringify(msgData);
    await redisClient.setEx(key, MSG_TTL_SECONDS,value);
}

async function getMessage(msgId) {
    const data = await redisClient.get(`msg:${msgId}`);
    return data ? JSON.parse(data) : null;
}

async function getReplyChain(startParentId){
    const chain = [];
    let currentId = startParentId;

    while (currentId && chain.length < 10){
        const msg = await getMessage(currentId);
        if (!msg) break;
        chain.push(msg);
        currentId = msg.parentId;
    }
    return chain;
}

module.exports = { saveMessage, getReplyChain };