const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// **IMPORTANTE**: Reemplaza con tu connection string
const MONGODB_URI = 'mongodb+srv://juego:amigosecreto@cluster0.bbxbqvp.mongodb.net/?appName=Cluster0';
const DATABASE_NAME = 'amigoSecreto';
const COLLECTION_NAME = 'game';

let db;

// Conectar a MongoDB
MongoClient.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log('✅ Conectado a MongoDB');
        db = client.db(DATABASE_NAME);
    })
    .catch(error => console.error('❌ Error de conexión:', error));

// ============================================
// RUTAS DE LA API
// ============================================

// Inicializar juego
app.post('/api/init', async (req, res) => {
    try {
        const { participants } = req.body;
        const collection = db.collection(COLLECTION_NAME);
        
        const existing = await collection.findOne({ _id: 'game' });
        
        if (!existing) {
            await collection.insertOne({
                _id: 'game',
                availableNames: participants,
                assignments: {}
            });
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener datos del juego
app.get('/api/game', async (req, res) => {
    try {
        const collection = db.collection(COLLECTION_NAME);
        const game = await collection.findOne({ _id: 'game' });
        res.json(game || { availableNames: [], assignments: {} });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Asignar nombre
app.post('/api/assign', async (req, res) => {
    try {
        const { username } = req.body;
        const collection = db.collection(COLLECTION_NAME);
        
        const game = await collection.findOne({ _id: 'game' });
        
        if (game.assignments[username]) {
            return res.json({ error: 'Ya participaste' });
        }
        
        let availableForUser = game.availableNames.filter(name => name !== username);
        
        if (availableForUser.length === 0) {
            return res.json({ error: 'No hay nombres disponibles' });
        }
        
        const randomIndex = Math.floor(Math.random() * availableForUser.length);
        const assignedTo = availableForUser[randomIndex];
        
        await collection.updateOne(
            { _id: 'game' },
            {
                $set: {
                    [`assignments.${username}`]: assignedTo
                },
                $pull: {
                    availableNames: assignedTo
                }
            }
        );
        
        res.json({ success: true, assignedTo });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ver todas las asignaciones
app.get('/api/assignments', async (req, res) => {
    try {
        const collection = db.collection(COLLECTION_NAME);
        const game = await collection.findOne({ _id: 'game' });
        res.json(game?.assignments || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Resetear juego
app.post('/api/reset', async (req, res) => {
    try {
        const { participants } = req.body;
        const collection = db.collection(COLLECTION_NAME);
        
        await collection.updateOne(
            { _id: 'game' },
            {
                $set: {
                    availableNames: participants,
                    assignments: {}
                }
            },
            { upsert: true }
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
