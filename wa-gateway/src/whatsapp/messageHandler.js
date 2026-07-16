async function handleMessage(sock, m) {
    if (m.type !== 'notify') return;

    const msg = m.messages[0];
    if (!msg.message) return;

    console.log(JSON.stringify(msg, null, 2));

    const quotedMessage = msg.message.extendedTextMessage?.contextInfo.quotedMessage;

    if (quotedMessage){
        console.log("quoted:", JSON.stringify(quotedMessage, null, 2));
    }
}

module.exports = { handleMessage }; 