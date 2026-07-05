// App State
let isAuthenticated = false; 
let balance = 10000.00;
const prices = { "EUR/USD": 1.1000, "GBP/USD": 1.2500, "USD/JPY": 145.00, "BTC/USD": 65000.00 };
let currentPair = "EUR/USD";

function getPipPrecision(pair) {
  return (pair === "USD/JPY" || pair === "BTC/USD") ? 2 : 4;
}

// Intercept Layout Engine to enforce Verification Checks
function processOrder(type) {
  const statusMsg = document.getElementById("tradeMsg");
  
  if (!isAuthenticated) {
    statusMsg.innerText = "Authentication Required: Sign in to execute trades.";
    statusMsg.style.color = "var(--danger)";
    openAuthModal('login');
    return;
  }

  const amountInput = document.getElementById("amount");
  const amount = parseFloat(amountInput.value);
  statusMsg.innerText = "";

  if (isNaN(amount) || amount <= 0) {
    statusMsg.innerText = "Error: Enter a valid transaction volume.";
    statusMsg.style.color = "var(--danger)";
    return;
  }

  if (type === "BUY" && amount > balance) {
    statusMsg.innerText = "Error: Insufficient funds.";
    statusMsg.style.color = "var(--danger)";
    return;
  }

  const priceSnap = prices[currentPair].toFixed(getPipPrecision(currentPair));
  if (type === "BUY") {
    balance -= amount;
    addHistoryRecord("BUY", currentPair, amount, priceSnap);
    statusMsg.innerText = "Order Filled: Long Position opened.";
    statusMsg.style.color = "var(--success)";
  } else {
    balance += amount;
    addHistoryRecord("SELL", currentPair, amount, priceSnap);
    statusMsg.innerText = "Order Filled: Short Position opened.";
    statusMsg.style.color = "var(--danger)";
  }
  amountInput.value = "";
  updateUI();
}

function buyTrade() { processOrder("BUY"); }
function sellTrade() { processOrder("SELL"); }

// Auth Modals Routing Engine
function openAuthModal(view) {
  const container = document.getElementById("modalFormContainer");
  document.getElementById("authModal").classList.remove("hidden");

  if (view === 'login') {
    container.innerHTML = `
      <div class="auth-title"><h2>Secure Sign In</h2><p class="subtitle">Access your trading account</p></div>
      <p id="modalError" class="error-msg hidden"></p>
      <form onsubmit="submitAuth(event, 'login')">
        <div class="input-group"><label>Username</label><input type="text" id="auth_user" required placeholder="trader_one"></div>
        <div class="input-group"><label>Password</label><input type="password" id="auth_pass" required placeholder="••••••••"></div>
        <button type="submit" class="btn btn-primary" style="width:100%">Sign In</button>
      </form>
      <p style="margin-top:1.5rem; text-align:center; font-size:0.875rem; color:var(--text-muted)">
        New to the platform? <span class="form-link" onclick="openAuthModal('register')">Register here</span>
      </p>`;
  } else {
    container.innerHTML = `
      <div class="auth-title"><h2>Open Account</h2><p class="subtitle">Create institutional credentials</p></div>
      <p id="modalError" class="error-msg hidden"></p>
      <form onsubmit="submitAuth(event, 'register')">
        <div class="input-group"><label>Username</label><input type="text" id="auth_user" required placeholder="trader_one"></div>
        <div class="input-group"><label>Password</label><input type="password" id="auth_pass" required placeholder="Minimum 8 chars"></div>
        <div class="input-group"><label>Confirm Password</label><input type="password" id="auth_confirm" required placeholder="••••••••"></div>
        <button type="submit" class="btn btn-primary" style="width:100%">Create Account</button>
      </form>
      <p style="margin-top:1.5rem; text-align:center; font-size:0.875rem; color:var(--text-muted)">
        Already verified? <span class="form-link" onclick="openAuthModal('login')">Sign in here</span>
      </p>`;
  }
}

function closeAuthModal() {
  document.getElementById("authModal").classList.add("hidden");
}

function submitAuth(event, type) {
  event.preventDefault();
  const user = document.getElementById("auth_user").value.trim();
  const pass = document.getElementById("auth_pass").value;
  const errorEl = document.getElementById("modalError");

  if (type === 'register') {
    const confirmPass = document.getElementById("auth_confirm").value;
    if (pass.length < 8) {
      errorEl.innerText = "Password must be at least 8 characters.";
      errorEl.classList.remove("hidden");
      return;
    }
    if (pass !== confirmPass) {
      errorEl.innerText = "Passwords do not match.";
      errorEl.classList.remove("hidden");
      return;
    }
  }

  // Authentication status conversion successful
  isAuthenticated = true;
  closeAuthModal();
  
  // Transform layout headers to showcase user profiles
  document.getElementById("authHeaderActions").innerHTML = `
    <span style="margin-right:15px; color:var(--text-muted); align-self:center">Active: <strong>${user}</strong></span>
    <button class="btn btn-secondary btn-sm" onclick="logout()">Logout</button>
  `;
  
  document.getElementById("tradeMsg").innerText = "Successfully logged in. Execution features unlocked.";
  document.getElementById("tradeMsg").style.color = "var(--success)";
}

function logout() {
  window.location.reload();
}

// Base Operational Engine Loops
function updateUI() {
  document.getElementById("balance").innerText = `$${balance.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
  document.getElementById("price").innerText = prices[currentPair].toFixed(getPipPrecision(currentPair));
}

function changePair() {
  currentPair = document.getElementById("pair").value;
  updateUI();
}

function addHistoryRecord(action, pair, volume, executionPrice) {
  const historyContainer = document.getElementById("history");
  const emptyPlaceholder = historyContainer.querySelector('.ledger-empty');
  if (emptyPlaceholder) emptyPlaceholder.remove();

  const timestamp = new Date().toLocaleTimeString();
  const li = document.createElement("li");
  li.innerHTML = `<span>[${timestamp}] <strong>${action}</strong> ${pair}</span><span>Vol: $${volume.toFixed(2)} @ ${executionPrice}</span>`;
  historyContainer.insertBefore(li, historyContainer.firstChild);
}

// Active market feed simulations run universally right out of the gate
setInterval(() => {
  for (let pair in prices) {
    const scaleFactor = prices[pair] > 1000 ? 15.0 : (prices[pair] > 100 ? 0.05 : 0.0002);
    prices[pair] = Math.max(0.0001, prices[pair] + ((Math.random() - 0.5) * scaleFactor));
  }
  updateUI();
}, 2000);

updateUI();
