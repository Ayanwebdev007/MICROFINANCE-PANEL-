/**
 * Generates an array of search keywords from a string.
 * This enables partial and case-insensitive searching in Firestore.
 * @param {string} str - The string to tokenize.
 * @returns {string[]} - Array of unique keywords.
 */
function generateKeywords(str) {
    if (!str) return [];
    const keywords = new Set();
    const cleanStr = str.toLowerCase().trim();

    // Split by spaces and special characters
    const words = cleanStr.split(/[\s\-_,.]+/);

    words.forEach(word => {
        if (!word) return;
        // Prefix tokens for each word
        for (let i = 1; i <= word.length; i++) {
            keywords.add(word.substring(0, i));
        }
    });

    // Individual words
    words.forEach(word => {
        if (word) keywords.add(word);
    });

    return Array.from(keywords);
}

module.exports = {
    generateKeywords
};
