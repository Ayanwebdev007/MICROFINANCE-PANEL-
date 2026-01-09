const { getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
    app.get('/api/admin/get-gl-codes', async function (req, res){
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        
        try {
            const getGl = await db.collection(token.bankId).doc('admin').collection('gl_code').doc('value').get();
            if (getGl.exists){
                const loadedGL = Object.values(getGl.data().gl);
                res.send({success: true, data: loadedGL});
            }else {
                res.send({error: 'Please add GL Code first'});
            }
        } catch (error) {
            console.error("Error fetching GL codes:", error);
            res.status(500).send({error: 'Failed to fetch GL codes. Try again...'});
        }
    });

    app.post('/api/admin/update-gl-code', async (req, res) => {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        try {
            const glRef = db.collection(token.bankId).doc('admin').collection('gl_code').doc('value');
    
            const glDoc = await glRef.get();
            let currentGLArray = [];
    
            if (glDoc.exists && Array.isArray(glDoc.data().gl)) {
                currentGLArray = glDoc.data().gl;
            }
    
            const incomingGL = req.body.gl;
    
            const index = currentGLArray.findIndex(item => item.code === incomingGL.code);
    
            // IF GL CODE EXIST THEN UPDATE
            if (index !== -1) {
                currentGLArray[index] = {
                    ...currentGLArray[index],
                    ...incomingGL
                };
            } else {
                // Add new GL IF NOT EXIST
                currentGLArray.push(incomingGL);
            }
    
            await glRef.set({ gl: currentGLArray });
    
            res.send({
                success: "GL Code updated successfully!",
                data: incomingGL
            });
        } catch (error) {
            console.error("Error updating GL code:", error);
            res.status(500).send({error: 'Failed to update GL code. Try again...'});
        }
    });
}

