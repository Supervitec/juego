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
const DB_KEY = "amigo_secreto_db";

function initDB() {
    let db = localStorage.getItem(DB_KEY);
    if (!db) {
        const initialDB = {
            availableNames: [...PARTICIPANTS],
            assignments: {}
        };
        localStorage.setItem(DB_KEY, JSON.stringify(initialDB));
    }
}

function getDB() {
    return JSON.parse(localStorage.getItem(DB_KEY));
}

function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

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

initDB();

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (email === VALID_EMAIL && password === VALID_PASSWORD) {
        loginError.textContent = '';
        showUserSelection();
    } else {
        loginError.textContent = '❌ Correo o contraseña incorrectos';
    }
});

function showUserSelection() {
    loginScreen.classList.remove('active');
    userSelectionScreen.classList.add('active');
    
    userList.innerHTML = '';
    PARTICIPANTS.forEach(name => {
        const btn = document.createElement('button');
        btn.className = 'user-btn';
        btn.textContent = name;
        btn.onclick = () => selectUser(name);
        userList.appendChild(btn);
    });
}

function selectUser(name) {
    currentUser = name;
    userSelectionScreen.classList.remove('active');
    bagScreen.classList.add('active');
    userGreeting.textContent = `¡Hola, ${name}! 🎅`;
    resultContainer.classList.add('hidden');
}

magicBag.addEventListener('click', () => {
    const db = getDB();
    
    if (db.assignments[currentUser]) {
        alert('¡Ya participaste! Tu nombre ya fue asignado.');
        return;
    }

    if (db.availableNames.length === 0) {
        alert('¡Todos los nombres ya fueron asignados!');
        return;
    }

    magicBag.classList.add('shake');
    setTimeout(() => {
        magicBag.classList.remove('shake');
        drawName();
    }, 600);
});

function drawName() {
    const db = getDB();
    let availableForUser = db.availableNames.filter(name => name !== currentUser);
    
    if (availableForUser.length === 0) {
        alert('No hay nombres disponibles para ti.');
        return;
    }

    const randomIndex = Math.floor(Math.random() * availableForUser.length);
    const drawnName = availableForUser[randomIndex];

    db.assignments[currentUser] = drawnName;
    db.availableNames = db.availableNames.filter(name => name !== drawnName);
    saveDB(db);

    showResult(drawnName);
}

function showResult(name) {
    selectedNameEl.textContent = name;
    resultContainer.classList.remove('hidden');
    
    createConfetti();
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

function createConfetti() {
    const confettiContainer = document.querySelector('.confetti-container');
    confettiContainer.innerHTML = '';
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#ffd700', '#ff69b4', '#4facfe', '#43e97b'];
    
    for (let i = 0; i < 80; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'absolute';
        confetti.style.width = Math.random() * 15 + 5 + 'px';
        confetti.style.height = confetti.style.width;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-20px';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.opacity = Math.random() * 0.5 + 0.5;
        
        confettiContainer.appendChild(confetti);
        
        const duration = Math.random() * 2 + 2;
        const rotation = Math.random() * 720 - 360;
        
        confetti.animate([
            { 
                transform: 'translateY(0) rotate(0deg)', 
                opacity: 1 
            },
            { 
                transform: `translateY(${window.innerHeight + 50}px) rotate(${rotation}deg)`, 
                opacity: 0 
            }
        ], {
            duration: duration * 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        setTimeout(() => confetti.remove(), duration * 1000);
    }
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

function resetDB() {
    localStorage.removeItem(DB_KEY);
    initDB();
    console.log('✅ Base de datos reseteada');
    alert('Base de datos reseteada correctamente');
}
