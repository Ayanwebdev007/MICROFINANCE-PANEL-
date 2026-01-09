const glService = require('../../services/glService');

module.exports = app => {
    app.get('/api/admin/get-gl-codes', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        try {
            const loadedGL = await glService.getAllGLCodes(token.bankId);
            if (loadedGL.length > 0) {
                res.send({ success: true, data: loadedGL });
            } else {
                res.send({ error: 'Please add GL Code first' });
            }
        } catch (error) {
            console.error("Error fetching GL codes:", error);
            res.status(500).send({ error: 'Failed to fetch GL codes. Try again...' });
        }
    });

    app.post('/api/admin/update-gl-code', async (req, res) => {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        try {
            const incomingGL = req.body.gl;
            if (!incomingGL || !incomingGL.code) {
                return res.status(400).send({ error: 'Invalid GL data. Code is required.' });
            }

            await glService.updateGLCode(token.bankId, incomingGL);

            res.send({
                success: "GL Code updated successfully!",
                data: incomingGL
            });
        } catch (error) {
            console.error("Error updating GL code:", error);
            res.status(500).send({ error: 'Failed to update GL code. Try again...' });
        }
    });
}

