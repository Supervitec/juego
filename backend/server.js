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

const PREDEFINED_ASSIGNMENTS = {
  "ALVAREZ HENAO VICTOR EMILIO": "PALACIO LONDOÑO ALBERNY",
  "CORREA GOMEZ CESAR AUGUSTO": "VELASQUEZ DIAZ JORGE ANDRES",
  "MUÑOZ ARTEAGA ELVER JOBANY": "GARCIA TIBADUZA YULIETH TATIANA",
  "SOLORZANO MURCIA JUAN DIEGO": "ROSADO SERRANO JHONATAN HABID",
  "CALVO ARREDONDO DIEGO FERNANDO": "GONZALEZ GARCIA JHON FABER",
  "GONZALEZ GARCIA JHON FABER": "CALVO ARREDONDO DIEGO FERNANDO",
  "GIRALDO GONZALEZ RAMIRO": "VELASQUEZ TREJOS JHONATAN ANDRES",
  "PALACIO LONDOÑO ALBERNY": "FELIX ANTONIO LOPEZ MARIN",
  "VARGAS GOMEZ SERGIO DAVID": "CELIS ARIAS JUAN ESTEBAN",
  "VELEZ ARBOLEDA GUSTAVO ADOLFO": "CORREA GOMEZ CESAR AUGUSTO",
  "FELIX ANTONIO LOPEZ MARIN": "ERAZO YURI ESPERANZA",
  "GARCIA TIBADUZA YULIETH TATIANA": "VARGAS GOMEZ SERGIO DAVID",
  "CELIS ARIAS JUAN ESTEBAN": "MORALES AMAYA JOSE DOMINGO",
  "GIRALDO ARISTIZABAL JOSE FERNANDO": "GIRALDO ARISTIZABAL ALFREDO",
  "GALLEGO SANCHEZ JAIR": "MARTINEZ TANGARIFE SORANI",
  "VELASQUEZ TREJOS JHONATAN ANDRES": "GIRALDO GONZALEZ RAMIRO",
  "ROSADO SERRANO JHONATAN HABID": "MUÑOZ ARTEAGA ELVER JOBANY",
  "MORALES AMAYA JOSE DOMINGO": "GALLEGO SANCHEZ JAIR",
  "GUERRA GUZMAN JORGE ELIECER": "VELEZ ARBOLEDA GUSTAVO ADOLFO",
  "VELASQUEZ DIAZ JORGE ANDRES": "GUERRA GUZMAN JORGE ELIECER",
  "ERAZO YURI ESPERANZA": "FELIX ANTONIO LOPEZ MARIN",
  "MARTINEZ TANGARIFE SORANI": "SOLORZANO MURCIA JUAN DIEGO",
  "GIRALDO ARISTIZABAL ALFREDO": "GIRALDO ARISTIZABAL JOSE FERNANDO",
  "ARIAS PIEDRAHITA JUAN CARLOS": "ALVAREZ HENAO VICTOR EMILIO"
};

// Ruta de prueba
app.get('/api', (req, res) => {
  res.json({
    message: 'API de Amigo Secreto funcionando',
    status: 'online',
    mongoConnected: isConnected
  });
});

app.post('/api/init', ensureConnection, async (req, res) => {
  try {
    const { participants } = req.body;
    const collection = db.collection(COLLECTION_NAME);

    // ---- DERANGEMENT ----
    let givers = [...participants];
    let receivers, valid = false;
    let attempts = 0;
    do {
      receivers = [...participants].sort(() => Math.random() - 0.5);
      valid = givers.every((giver, idx) => giver !== receivers[idx]);
      attempts++;
    } while (!valid && attempts < 1000);

    if (!valid) return res.status(500).json({ error: "No se pudo generar un sorteo válido" });

    let assignments = {};
    for (let i = 0; i < givers.length; i++) {
      assignments[givers[i]] = receivers[i];
    }

    await collection.updateOne(
      { _id: 'game' },
      { $set: { assignments, availableNames: [] } },
      { upsert: true }
    );

    res.json({ success: true, assignments });
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