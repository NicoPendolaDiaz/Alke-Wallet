// Referencias al DOM
// Elementos UI
const saldoDisplay = document.getElementById('saldo-display');
const mensajeFeedback = document.getElementById('mensaje-feedback');
const historialLista = document.getElementById('historial-lista');
const monedaSelect = document.getElementById('moneda-select');
const totalIngresosDisplay = document.getElementById('total-ingresos');
const totalGastosDisplay = document.getElementById('total-gastos');

// Estado inicial: Cargar de localStorage o usar valores por defecto
let saldo = parseFloat(localStorage.getItem('wallet_saldo')) || 0;
let historial = JSON.parse(localStorage.getItem('wallet_historial')) || [];
let usuarioActual = localStorage.getItem('wallet_user') || null;
let monedaActual = localStorage.getItem('wallet_currency') || 'CLP'; // Persistencia de moneda

// --- AUTH GUARD ---
const currentPage = window.location.pathname;
const isLoginPage = currentPage.includes('Login.html');
const isIndexPage = currentPage.includes('index.html') || currentPage.endsWith('/') || currentPage.endsWith('\\');

if (usuarioActual && isLoginPage) {
    window.location.href = 'menu.html';
}
if (!usuarioActual && !isLoginPage && !isIndexPage) {
    window.location.href = 'Login.html';
}

// Tasas de cambio simuladas (Base: CLP)
const tasasDeCambio = {
    CLP: 1,
    USD: 0.00105, // Ejemplo: 1 CLP = 0.00105 USD (aprox 950 CLP/USD)
    EUR: 0.00096  // Ejemplo: 1 CLP = 0.00096 EUR
};

// Configurar selector de moneda si existe en la página actual
if (monedaSelect) {
    monedaSelect.value = monedaActual;
    monedaSelect.addEventListener('change', () => {
        monedaActual = monedaSelect.value;
        localStorage.setItem('wallet_currency', monedaActual);
        actualizarVista();
    });
}

// Inicializar vista
actualizarVista();

// Función principal para actualizar toda la interfaz
function actualizarVista() {
    const tasa = tasasDeCambio[monedaActual];

    // Definir símbolo según moneda
    let simbolo = '$';
    if (monedaActual === 'EUR') simbolo = '€';
    else if (monedaActual === 'USD') simbolo = 'US$';
    else simbolo = 'CLP$';

    // Actualizar Saldo (solo si el elemento existe en la página)
    if (saldoDisplay) {
        const saldoConvertido = saldo * tasa;
        saldoDisplay.textContent = `${simbolo} ${saldoConvertido.toFixed(2)}`;
    }

    renderizarHistorial();
    actualizarResumen(tasa, simbolo);
}

// Función para guardar en el navegador
function guardarDatos() {
    localStorage.setItem('wallet_saldo', saldo);
    localStorage.setItem('wallet_historial', JSON.stringify(historial));
}

// Función para mostrar mensajes temporales
function mostrarMensaje(texto, color) {
    if (mensajeFeedback) {
        mensajeFeedback.textContent = texto;
        mensajeFeedback.style.color = color;
        setTimeout(() => {
            mensajeFeedback.textContent = '';
        }, 3000);
    }
}

// Función para agregar movimiento al historial
function registrarMovimiento(tipo, monto, detalle = '') {
    const fecha = new Date().toLocaleDateString();
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const movimiento = {
        tipo: tipo,
        monto: monto,
        detalle: detalle,
        fecha: `${fecha} ${hora}`
    };

    historial.push(movimiento);
    guardarDatos();
}

// Función para renderizar la lista de historial
function renderizarHistorial() {
    if (!historialLista) return;

    historialLista.innerHTML = '';
    
    // Mostrar el historial invertido (más reciente arriba)
    historial.slice().reverse().forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        
        const esIngreso = item.tipo === 'deposito';
        const signo = esIngreso ? '+' : '-';
        const claseColor = esIngreso ? 'text-green' : 'text-red';
        const titulo = esIngreso ? 'Depósito' : (item.tipo === 'envio' ? `Envío a ${item.detalle}` : 'Retiro');

        li.innerHTML = `
            <span>${item.fecha} - ${titulo}</span>
            <span class="${claseColor}">${signo} $${item.monto.toFixed(2)}</span>
        `;
        
        historialLista.appendChild(li);
    });
}

// Función para calcular y mostrar resumen de ingresos vs gastos
function actualizarResumen(tasa, simbolo) {
    if (!totalIngresosDisplay) return;

    let ingresos = 0;
    let gastos = 0;

    historial.forEach(item => {
        if (item.tipo === 'deposito') {
            ingresos += item.monto;
        } else {
            gastos += item.monto;
        }
    });

    // Convertir y mostrar
    totalIngresosDisplay.textContent = `${simbolo} ${(ingresos * tasa).toFixed(2)}`;
    totalGastosDisplay.textContent = `${simbolo} ${(gastos * tasa).toFixed(2)}`;
}

// --- EVENT LISTENERS ---

// 1. LOGIN
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;

        // Validación simple (Simulada)
        if (user && pass) {
            usuarioActual = user;
            localStorage.setItem('wallet_user', user);
            window.location.href = 'menu.html';
        } else {
            document.getElementById('login-error').textContent = 'Credenciales inválidas';
        }
    });
}

const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        usuarioActual = null;
        localStorage.removeItem('wallet_user');
        window.location.href = 'Login.html';
    });
}

// 2. NAVEGACIÓN MENÚ
const navDepositar = document.getElementById('nav-depositar');
if (navDepositar) navDepositar.addEventListener('click', () => window.location.href = 'deposit.html');

const navEnviar = document.getElementById('nav-enviar');
if (navEnviar) navEnviar.addEventListener('click', () => window.location.href = 'sendmoney.html');

const navMovimientos = document.getElementById('nav-movimientos');
if (navMovimientos) navMovimientos.addEventListener('click', () => window.location.href = 'transactions.html');

// Botones "Volver"
document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => window.location.href = 'menu.html');
});

// 3. LÓGICA DEPOSITO
const btnConfirmDeposit = document.getElementById('btn-confirm-deposit');
if (btnConfirmDeposit) {
    btnConfirmDeposit.addEventListener('click', () => {
    const input = document.getElementById('deposit-amount');
    const monto = parseFloat(input.value);

    if (isNaN(monto) || monto <= 0) {
        mostrarMensaje("Ingrese un monto válido.", "red");
        return;
    }
    saldo += monto;
    registrarMovimiento('deposito', monto);
    actualizarVista();
    mostrarMensaje(`Depósito exitoso de $${monto}`, "green");
    input.value = '';
    setTimeout(() => window.location.href = 'menu.html', 1000); // Volver al home tras 1s
    });
}

// 4. LÓGICA ENVIAR DINERO
const btnConfirmSend = document.getElementById('btn-confirm-send');
if (btnConfirmSend) {
    btnConfirmSend.addEventListener('click', () => {
    const inputMonto = document.getElementById('send-amount');
    const inputDest = document.getElementById('send-destinatario');
    const monto = parseFloat(inputMonto.value);
    const destinatario = inputDest.value;

    if (isNaN(monto) || monto <= 0) {
        mostrarMensaje("Ingrese un monto válido.", "red");
        return;
    }
    if (!destinatario) {
        mostrarMensaje("Ingrese un destinatario.", "red");
        return;
    }
    if (monto > saldo) {
        mostrarMensaje("Fondos insuficientes.", "red");
        return;
    }

    saldo -= monto;
    registrarMovimiento('envio', monto, destinatario);
    actualizarVista();
    mostrarMensaje(`Envío de $${monto} a ${destinatario} exitoso`, "orange");
    inputMonto.value = '';
    inputDest.value = '';
    setTimeout(() => window.location.href = 'menu.html', 1500);
    });
}

// Evento: Borrar Historial
const btnBorrarHistorial = document.getElementById('btn-borrar-historial');
if (btnBorrarHistorial) {
    btnBorrarHistorial.addEventListener('click', () => {
        if (confirm('¿Estás seguro de borrar todo el historial?')) {
            historial = [];
            guardarDatos();
            actualizarVista();
            mostrarMensaje("Historial eliminado.", "gray");
        }
    });
}