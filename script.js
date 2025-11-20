// ============================================
// CONFIGURACIÓN DE MONGODB
// ============================================
const API_URL = 'https://juego-1jlp1gbcw-supervitecs-projects.vercel.app/api'; 

// LISTA DE PARTICIPANTES
const PARTICIPANTS = [
    "Carlos Rodríguez",
    "María García",
    "Juan López",
    "Ana Martínez",
    "Pedro Sánchez",
    "Laura Fernández",
    "Felipe Castro",
    "Sofia Torres"
];

const VALID_EMAIL = "supervitecapp@gmail.com";
const VALID_PASSWORD = "supervitec123";

// Elementos del DOM
const loginScreen = document.getElementById('login-screen');
const userSelectionScreen = document.getElementById('user-selection-screen');
const bagScreen = document.getElementById('bag-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const userList = document.getElementById('user-list');
const magicBag = document.getElementById('magic-bag');
const resultContainer = document.getElementById('result-container');
const selectedNameEl = document.getElementById('selected-name');
const userGreeting = document.getElementById('user-greeting');
const loadingOverlay = document.getElementById('loading');

let currentUser = null;
let countdownInterval = null;

// ============================================
// FUNCIONES DE API
// ============================================

function showLoading(show = true) {
    if (show) {
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}

async function initDatabase() {
    try {
        const response = await fetch(`${API_URL}/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants: PARTICIPANTS })
        });
        return await response.json();
    } catch (error) {
        console.error('Error al inicializar:', error);
        return null;
    }
}

async function getGameData() {
    try {
        const response = await fetch(`${API_URL}/game`);
        return await response.json();
    } catch (error) {
        console.error('Error al obtener datos:', error);
        return null;
    }
}

async function assignName(username) {
    try {
        const response = await fetch(`${API_URL}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        return await response.json();
    } catch (error) {
        console.error('Error al asignar nombre:', error);
        return null;
    }
}

async function getAllAssignments() {
    try {
        const response = await fetch(`${API_URL}/assignments`);
        return await response.json();
    } catch (error) {
        console.error('Error al obtener asignaciones:', error);
        return null;
    }
}

// ============================================
// LOGIN
// ============================================

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (email === VALID_EMAIL && password === VALID_PASSWORD) {
        loginError.textContent = '';
        showLoading(true);
        await initDatabase();
        showLoading(false);
        showUserSelection();
    } else {
        loginError.textContent = '❌ Credenciales incorrectas';
    }
});

// ============================================
// SELECCIÓN DE USUARIO
// ============================================

async function showUserSelection() {
    loginScreen.classList.remove('active');
    userSelectionScreen.classList.add('active');
    
    showLoading(true);
    const data = await getGameData();
    showLoading(false);
    
    if (!data) {
        alert('Error al cargar los datos');
        return;
    }
    
    userList.innerHTML = '';
    
    PARTICIPANTS.forEach(name => {
        const btn = document.createElement('button');
        btn.className = 'user-btn';
        btn.textContent = name;
        
        if (data.assignments && data.assignments[name]) {
            btn.textContent = name + ' ✓';
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.onclick = () => {
                alert('Este usuario ya participó en el sorteo.');
            };
        } else {
            btn.onclick = () => selectUser(name);
        }
        
        userList.appendChild(btn);
    });
}

function selectUser(name) {
    currentUser = name;
    userSelectionScreen.classList.remove('active');
    bagScreen.classList.add('active');
    userGreeting.textContent = `Hola, ${name}`;
    resultContainer.classList.add('hidden');
}

// ============================================
// SORTEO
// ============================================

magicBag.addEventListener('click', async () => {
    showLoading(true);
    const data = await getGameData();
    showLoading(false);
    
    if (!data) {
        alert('Error al cargar los datos');
        return;
    }
    
    if (data.assignments[currentUser]) {
        alert('Ya participaste. Tu nombre ya fue asignado.');
        return;
    }

    if (!data.availableNames || data.availableNames.length === 0) {
        alert('Todos los nombres ya fueron asignados.');
        return;
    }

    magicBag.classList.add('shake');
    setTimeout(async () => {
        magicBag.classList.remove('shake');
        await drawName();
    }, 500);
});

async function drawName() {
    showLoading(true);
    const result = await assignName(currentUser);
    showLoading(false);
    
    if (!result || result.error) {
        alert(result?.error || 'Error al asignar nombre');
        return;
    }
    
    showResult(result.assignedTo);
}

// ============================================
// RESULTADO
// ============================================

function showResult(name) {
    selectedNameEl.textContent = name;
    resultContainer.classList.remove('hidden');
    startCountdown();
}

function startCountdown() {
    let timeLeft = 10;
    const countdownEl = document.getElementById('countdown');
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    countdownInterval = setInterval(() => {
        timeLeft--;
        countdownEl.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            logout();
        }
    }, 1000);
}

function logout() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    currentUser = null;
    bagScreen.classList.remove('active');
    loginScreen.classList.add('active');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
}

// ============================================
// FUNCIÓN PARA VER TODAS LAS ASIGNACIONES
// ============================================

async function verAsignaciones() {
    const data = await getAllAssignments();
    console.table(data);
}
