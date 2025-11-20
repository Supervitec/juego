// ============================================
// LISTA DE PARTICIPANTES
// ============================================
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
const DB_KEY = "amigo_secreto_data";

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

let currentUser = null;
let countdownInterval = null;

// ============================================
// FUNCIONES DE BASE DE DATOS (localStorage)
// ============================================

function initDatabase() {
    let data = localStorage.getItem(DB_KEY);
    if (!data) {
        const initialData = {
            availableNames: [...PARTICIPANTS],
            assignments: {}
        };
        localStorage.setItem(DB_KEY, JSON.stringify(initialData));
        console.log('✅ Base de datos inicializada');
    }
}

function getDatabase() {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : null;
}

function saveDatabase(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

// ============================================
// LOGIN
// ============================================

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (email === VALID_EMAIL && password === VALID_PASSWORD) {
        loginError.textContent = '';
        initDatabase();
        showUserSelection();
    } else {
        loginError.textContent = '❌ Credenciales incorrectas';
    }
});

// ============================================
// SELECCIÓN DE USUARIO
// ============================================

function showUserSelection() {
    loginScreen.classList.remove('active');
    userSelectionScreen.classList.add('active');
    
    const data = getDatabase();
    userList.innerHTML = '';
    
    PARTICIPANTS.forEach(name => {
        const btn = document.createElement('button');
        btn.className = 'user-btn';
        btn.textContent = name;
        
        // Verificar si el usuario ya participó
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
    const data = getDatabase();
    
    // Verificar nuevamente si ya participó
    if (data.assignments && data.assignments[name]) {
        alert('Ya participaste en el sorteo.');
        showUserSelection();
        return;
    }
    
    currentUser = name;
    userSelectionScreen.classList.remove('active');
    bagScreen.classList.add('active');
    userGreeting.textContent = `Hola, ${name}`;
    resultContainer.classList.add('hidden');
}

// ============================================
// SORTEO
// ============================================

magicBag.addEventListener('click', () => {
    const data = getDatabase();
    
    // Verificar si ya participó
    if (data.assignments[currentUser]) {
        alert('Ya participaste. Tu nombre ya fue asignado.');
        return;
    }

    // Verificar si hay nombres disponibles
    if (!data.availableNames || data.availableNames.length === 0) {
        alert('Todos los nombres ya fueron asignados.');
        return;
    }

    // Animar la bolsa
    magicBag.classList.add('shake');
    setTimeout(() => {
        magicBag.classList.remove('shake');
        drawName();
    }, 500);
});

function drawName() {
    const data = getDatabase();
    let availableForUser = data.availableNames.filter(name => name !== currentUser);
    
    if (availableForUser.length === 0) {
        alert('No hay nombres disponibles para ti.');
        return;
    }

    // Seleccionar nombre aleatorio
    const randomIndex = Math.floor(Math.random() * availableForUser.length);
    const drawnName = availableForUser[randomIndex];

    // Actualizar base de datos
    data.assignments[currentUser] = drawnName;
    data.availableNames = data.availableNames.filter(name => name !== drawnName);
    
    saveDatabase(data);
    showResult(drawnName);
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
// FUNCIÓN DE RESETEO (SOLO PARA TESTING)
// ============================================

function resetDatabase() {
    const initialData = {
        availableNames: [...PARTICIPANTS],
        assignments: {}
    };
    localStorage.setItem(DB_KEY, JSON.stringify(initialData));
    console.log('✅ Base de datos reseteada');
    alert('Base de datos reseteada correctamente');
}

// Inicializar al cargar
initDatabase();
