/**
 * Centralized utility functions for string manipulation.
 */

/**
 * Generates a random alphanumeric string of a specified length.
 * @param {number} length - The length of the string to generate.
 * @returns {string} The generated random string.
 */
/**
 * Generates a random string of a specified length using an optional character set.
 * @param {number} length - The length of the string to generate.
 * @param {string} [characters] - Optional character set to use.
 * @returns {string} The generated random string.
 */
function generateRandomString(length, characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}

module.exports = {
    generateRandomString,
};
