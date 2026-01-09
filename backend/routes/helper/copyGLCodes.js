const glService = require('../../services/glService');

module.exports = app => {
    app.get('/admin-patch-helper/copy-master-data/gl-codes', async function (req, res) {
        const bankId = '01_iTaxFinance__itNnpqyqNKLp3j';

        try {
            const result = await glService.syncFromMaster(bankId);
            return res.send(`Successfully copied ${result.count} GL Codes.`);
        } catch (e) {
            console.log('Copy GL Error:', e);
            return res.send({ error: 'Failed to copy GL codes. Try again...' });
        }
    });
}