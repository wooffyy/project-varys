const redisClient = require('../clients/redisClient');
const { saveMessage, getReplyChain } = require('../ingestion/replyChain');
const { handleWindowActivity } = require('../ingestion/windowManager');

async function handleMessage(sock, m) {
    if (m.type !== 'notify') return;

    const msg = m.messages[0];
    if (!msg.message) return;

    const msgId = msg.key.id;
    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid.split('@')[0];

    const msgContent = msg.message.documentWithCaptionMessage?.message || msg.message;

    const text = msgContent.conversation || 
        msgContent.extendedTextMessage?.text || 
        msgContent.documentMessage?.caption || 
        msgContent.imageMessage?.caption || 
        msgContent.videoMessage?.caption || 
        msg.message.extendedTextMessage?.text ||
        '';

    const parentMsgId = msgContent.extendedTextMessage?.contextInfo?.stanzaId ||
        msgContent.imageMessage?.contextInfo?.stanzaId ||
        msgContent.videoMessage?.contextInfo?.stanzaId ||
        msgContent.documentMessage?.contextInfo?.stanzaId ||
        msg.message.extendedTextMessage?.contextInfo?.stanzaId ||
        null;

    const isReply = !!parentMsgId;

    let mediaType = 'text';
    if (msg.message.stickerMessage) mediaType = 'sticker';
    else if (msg.message.documentMessage) mediaType = 'document';
    else if (msg.message.imageMessage) mediaType = 'image';
    else if (msg.message.videoMessage) mediaType = 'video';
    
    const msgData = {
        id: msgId,
        chatId, 
        sender,
        text,
        mediaType,
        parentMsgId: parentMsgId || null,
        timestamp: Date.now()
    };

    await redisClient.zAdd(`chat:${chatId}`, {
        score: msgData.timestamp,
        value: JSON.stringify(msgData)
    });
    
    await saveMessage(msgId, msgData);
    console.log(`[Message saved] msgId: ${msgId} chatId: ${chatId} sender: ${sender} text: ${text}`);

    await handleWindowActivity(chatId, isReply);
    if (isReply) {
        console.log(`[Message reply] msgId: ${msgId} chatId: ${chatId} sender: ${sender} text: ${text}`);
        const chain = await getReplyChain(parentMsgId);

        if (chain.length > 0) {
            chain.forEach((prevMsg, index) => {
                console.log(`[Message chain] ${index}. ${prevMsg.sender}: ${prevMsg.text}`);
            }); 
        } else {
            console.log('Message Not Found in Redis');
        }        
    }
}

module.exports = { handleMessage };