const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB
const MONGODB_URI = 'mongodb+srv://juego:amigosecreto@cluster0.bbxbqvp.mongodb.net/?appName=Cluster0';
const DATABASE_NAME = 'amigoSecreto';
const COLLECTION_NAME = 'game';

let db;
let isConnected = false;

// Conectar a MongoDB
async function connectDB() {
  if (isConnected) return;
  try {
    const client = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conectado a MongoDB');
    db = client.db(DATABASE_NAME);
    isConnected = true;
  } catch (error) {
    console.error('❌ Error de conexión a MongoDB:', error);
    isConnected = false;
  }
}

// Middleware: asegurar conexión
async function ensureConnection(req, res, next) {
  if (!isConnected) {
    await connectDB();
  }
  if (!isConnected) {
    return res.status(500).json({ error: 'No se pudo conectar a la base de datos' });
  }
  next();
}

// Ruta de prueba
app.get('/api', (req, res) => {
  res.json({
    message: 'API de Amigo Secreto funcionando',
    status: 'online',
    mongoConnected: isConnected
  });
});

// Inicializar juego
app.post('/api/init', ensureConnection, async (req, res) => {
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
      console.log('✅ Juego inicializado (insert)');
    } else {
      // Si ya existe, opcionalmente puedes actualizar para resetear
      await collection.updateOne(
        { _id: 'game' },
        {
          $set: {
            availableNames: participants,
            assignments: existing.assignments || {}
          }
        }
      );
      console.log('✅ Juego inicializado (update)');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error al inicializar:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener datos del juego
app.get('/api/game', ensureConnection, async (req, res) => {
  try {
    const collection = db.collection(COLLECTION_NAME);
    const game = await collection.findOne({ _id: 'game' });
    res.json(game || { availableNames: [], assignments: {} });
  } catch (error) {
    console.error('Error al obtener datos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Asignar nombre
app.post('/api/assign', ensureConnection, async (req, res) => {
  try {
    const { username } = req.body;
    const collection = db.collection(COLLECTION_NAME);

    const game = await collection.findOne({ _id: 'game' });

    if (!game) {
      return res.json({ error: 'El juego no está inicializado' });
    }

    if (game.assignments[username]) {
      return res.json({ error: 'Ya participaste' });
    }

    const availableForUser = game.availableNames.filter(name => name !== username);

    if (availableForUser.length === 0) {
      return res.json({ error: 'No hay nombres disponibles' });
    }

    const randomIndex = Math.floor(Math.random() * availableForUser.length);
    const assignedTo = availableForUser[randomIndex];

    await collection.updateOne(
      { _id: 'game' },
      {
        $set: { [`assignments.${username}`]: assignedTo },
        $pull: { availableNames: assignedTo }
      }
    );

    console.log(`✅ ${username} -> ${assignedTo}`);
    res.json({ success: true, assignedTo });
  } catch (error) {
    console.error('Error al asignar:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ver asignaciones
app.get('/api/assignments', ensureConnection, async (req, res) => {
  try {
    const collection = db.collection(COLLECTION_NAME);
    const game = await collection.findOne({ _id: 'game' });
    res.json(game?.assignments || {});
  } catch (error) {
    console.error('Error al obtener asignaciones:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resetear juego completamente
app.post('/api/reset', ensureConnection, async (req, res) => {
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

    console.log('✅ Juego reseteado');
    res.json({ success: true });
  } catch (error) {
    console.error('Error al resetear:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
