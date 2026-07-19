function isOnlyEmoji(text) {
    const cleaned = text.trim().replace(/[\u200B-\u200D\uFE0F]/g, '');
    const emojiRegex = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u;
    
    return emojiRegex.test(cleaned);
}

function processWindow(messages) {
    if (!Array.isArray(messages) || messages.length === 0) return false;

    const validateMessage = messages.filter(msg => {
        const text = (msg.text || '').trim();
        const type = msg.mediaType || 'text';

        if (['document', 'image', 'video'].includes(type)) return true;

        if (!text) return false;
        if (isOnlyEmoji(text)) return false;
        
        return true;
    });

    return validateMessage.length > 0;
}

module.exports = { processWindow };