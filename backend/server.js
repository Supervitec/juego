const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

// Inicializar la bolsa de nombres y limpiar asignaciones
app.post('/api/init', ensureConnection, async (req, res) => {
  try {
    const { participants } = req.body;
    const collection = db.collection(COLLECTION_NAME);
    await collection.updateOne(
      { _id: 'game' },
      { $set: {
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

// Sorteo seguro: nadie se saca a sí mismo y sin repeticiones
app.post('/api/assign', ensureConnection, async (req, res) => {
  try {
    const { username } = req.body;
    const collection = db.collection(COLLECTION_NAME);
    const game = await collection.findOne({ _id: 'game' });

    if (!game) return res.json({ error: 'El juego no está inicializado' });
    if (!game.availableNames) return res.json({ error: 'No hay nombres disponibles.' });

    // Si ya fue asignado antes, devuelve siempre el mismo
    if (game.assignments && game.assignments[username]) {
      return res.json({ success: true, assignedTo: game.assignments[username] });
    }

    // Filtrar nombres disponibles excluyendo el suyo propio y los que ya fueron asignados
    const available = game.availableNames.filter(name => name !== username);

    if (available.length === 0) {
      return res.json({ error: 'No hay nombres disponibles' });
    }

    // Elegir uno al azar
    const randomIndex = Math.floor(Math.random() * available.length);
    const assignedTo = available[randomIndex];

    // Guardar la asignación y eliminar el nombre asignado de la bolsa
    await collection.updateOne(
      { _id: 'game' },
      {
        $set: { [`assignments.${username}`]: assignedTo },
        $pull: { availableNames: assignedTo }
      }
    );

    res.json({ success: true, assignedTo });
  } catch (error) {
    console.error('Error al asignar:', error);
    res.status(500).json({ error: error.message });
  }
});

// Consultar estado y asignaciones
app.get('/api/game', ensureConnection, async (req, res) => {
  try {
    const collection = db.collection(COLLECTION_NAME);
    const game = await collection.findOne({ _id: 'game' });
    res.json(game || { availableNames: [], assignments: {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/assignments', ensureConnection, async (req, res) => {
  try {
    const collection = db.collection(COLLECTION_NAME);
    const game = await collection.findOne({ _id: 'game' });
    res.json(game?.assignments || {});
  } catch (error) {
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
      { $set: { availableNames: participants, assignments: {} } },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
