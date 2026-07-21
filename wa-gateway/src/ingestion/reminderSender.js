function buildReminderText(aiResponse) {
    return `*IMPORTANT INFO DETECTED*\n\n` +
        `*Summary :* ${aiResponse.summary}\n\n` +
        `*Reason  :* ${aiResponse.reasoning}\n\n`;
}

async function sendReminder(sock, waNumber, aiResponse) {
    const myNumber = `${waNumber}@s.whatsapp.net`;
    await sock.sendMessage(myNumber, { text: buildReminderText(aiResponse) });
    console.log(`[Reminder Sent] Successfully sent reminder to ${myNumber}`);
}

module.exports = { sendReminder };