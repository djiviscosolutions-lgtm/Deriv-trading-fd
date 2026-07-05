// Application Architecture States
let currentEnvironment = "DEMO"; // Modes switcher variable matrix: ["DEMO", "REAL"]
let isAuthenticated = false; 
let activeUser = "";

// Segregated Account Ledger Balances
let balances = {
  DEMO: 50000.00,
  REAL: 0.00
};

const prices = { "EUR/USD": 1.1000, "GBP/USD": 1.2500, "USD/JPY": 145.00, "BTC/USD": 65000.00 };
let currentPair = "EUR/USD";
let mockHistory = [];
const maxVisibleCandles = 40;

function getPipPrecision(pair) {
  return (pair === "USD/JPY" || pair === "BTC/USD") ? 2 : 4;
}

// Switch Working Environments Engine
function switchEnvironment(env) {
  currentEnvironment = env;
  
  // Update interface switcher tabs styling layout rules
  document.getElementById("demoBtn").classList.toggle("active", env === "DEMO");
  document.getElementById("realBtn").classList.toggle("active", env === "REAL");
  
  // Reflect target platform balances
  const label = document.getElementById("balanceLabel");
  const badge = document.getElementById("chartFeedBadge");
  
  if (env === "DEMO") {
    label.innerText = "Demo Balance";
    badge.innerText = "Demo Feed";
    badge.className = "badge demo-badge";
  } else {
    label.innerText = "Live Vault Balance";
    badge.innerText = "Live Feed";
    badge.className = "badge real-badge";
  }

  document.getElementById("tradeMsg").innerText = "";
  generateOwnHistory();
  updateUI();
  renderOwnChart();
}

// Intercept Layout Transaction Pipeline for Environment Enforcements
function processOrder(type) {
  const statusMsg = document.getElementById("tradeMsg");
  statusMsg.innerText = "";

  // SECURITY GUARD CHECK: Gatekeeper real accounts if unauthenticated
  if (currentEnvironment === "REAL" && !isAuthenticated) {
    statusMsg.innerText = "Access Blocked: Sign in required for Live Execution.";
    statusMsg.style.color = "var(--danger)";
    openAuthModal('login');
    return;
  }

  const amountInput = document.getElementById("amount");
  const amount = parseFloat(amountInput.value);

  if (isNaN(amount) || amount <= 0) {
    statusMsg.innerText = "Invalid Parameter: Input a functional volume size.";
    statusMsg.style.color = "var(--danger)";
    return;
  }

  let currentBalance = balances[currentEnvironment];

  if (type === "BUY" && amount > currentBalance) {
    statusMsg.innerText = "Execution Cancelled: Insufficient margin depth.";
    statusMsg.style.color = "var(--danger)";
    return;
  }

  const priceSnap = prices[currentPair].toFixed(getPipPrecision(currentPair));
  
  if (type === "BUY") {
    balances[currentEnvironment] -= amount;
    addHistoryRecord("BUY", currentPair, amount, priceSnap, currentEnvironment);
    statusMsg.innerText = `Long Position Filled [${currentEnvironment}]`;
    statusMsg.style.color = "var(--success)";
  } else {
    balances[currentEnvironment] += amount;
    addHistoryRecord("SELL", currentPair, amount, priceSnap, currentEnvironment);
    statusMsg.innerText = `Short Position Filled [${currentEnvironment}]`;
    statusMsg.style.color = "var(--warning)";
  }

  amountInput.value = "";
  updateUI();
}

function buyTrade() { processOrder("BUY"); }
function sellTrade() { processOrder("SELL"); }

// Native HTML5 Canvas 2D Graphical Draw Loop Engine
function generateOwnHistory() {
  mockHistory = [];
  let basePrice = prices[currentPair];
  const variance = basePrice > 1000 ? 50 : (basePrice > 100 ? 0.30 : 0.002);
  
  let rollingClose = basePrice;
  for (let i = 0; i < maxVisibleCandles; i++) {
    let open = rollingClose;
    let close = open + ((Math.random() - 0.5) * variance);
    let high = Math.max(open, close) + (Math.random() * (variance / 2));
    let low = Math.min(open, close) - (Math.random() * (variance / 2));

    mockHistory.push({ open, high, low, close });
    rollingClose = close;
  }
  prices[currentPair] = mockHistory[mockHistory.length - 1].close;
}

function renderOwnChart() {
  const canvas = document.getElementById("customChart");
  const wrapper = document.getElementById("chartWrapper");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const rect = wrapper.getBoundingClientRect();
  
  canvas.width = rect.width;
  canvas.height = rect.height;

  const width = canvas.width;
  const height = canvas.height;
  const paddingRight = 75; 
  const paddingTopBottom = 25;
  const chartWidth = width - paddingRight;
  const chartHeight = height - (paddingTopBottom * 2);

  ctx.fillStyle = "#060911";
  ctx.fillRect(0, 0, width, height);

  if (mockHistory.length === 0) return;

  let maxPrice = Math.max(...mockHistory.map(c => c.high));
  let minPrice = Math.min(...mockHistory.map(c => c.low));
  
  const priceRange = maxPrice - minPrice || 0.01;
  maxPrice += priceRange * 0.05;
  minPrice -= priceRange * 0.05;
  const adjustedRange = maxPrice - minPrice;

  // Background Grid Matrix Lines
  ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
  ctx.lineWidth = 1;
  ctx.font = "10px monospace";
  ctx.fillStyle = "#64748b";

  const gridLinesCount = 5;
  for (let i = 0; i <= gridLinesCount; i++) {
    const y = paddingTopBottom + (chartHeight * (i / gridLinesCount));
    const priceValue = maxPrice - (adjustedRange * (i / gridLinesCount));

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(chartWidth, y);
    ctx.stroke();

    ctx.fillText(priceValue.toFixed(getPipPrecision(currentPair)), chartWidth + 10, y + 3);
  }

  // Draw Candlesticks Loops
  const candleSpacing = chartWidth / maxVisibleCandles;
  const candleWidth = candleSpacing * 0.72;

  for (let i = 0; i < mockHistory.length; i++) {
    const candle = mockHistory[i];
    const isBullish = candle.close >= candle.open;

    const x = (i * candleSpacing) + (candleSpacing - candleWidth) / 2;
    const yOpen = paddingTopBottom + chartHeight * (1 - (candle.open - minPrice) / adjustedRange);
    const yClose = paddingTopBottom + chartHeight * (1 - (candle.close - minPrice) / adjustedRange);
    const yHigh = paddingTopBottom + chartHeight * (1 - (candle.high - minPrice) / adjustedRange);
    const yLow = paddingTopBottom + chartHeight * (1 - (candle.low - minPrice) / adjustedRange);

    const color = isBullish ? "#10b981" : "#f43f5e";
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.moveTo(x + (candleWidth / 2), yHigh);
    ctx.lineTo(x + (candleWidth / 2), yLow);
    ctx.stroke();

    const top = Math.min(yOpen, yClose);
    const bodyHeight = Math.max(1, Math.abs(yOpen - yClose));
    ctx.fillRect(x, top, candleWidth, bodyHeight);
  }
}

function streamNativeTick() {
  if (mockHistory.length === 0) return;

  const latestCandle = mockHistory[mockHistory.length - 1];
  const basePrice = latestCandle.close;
  const scale = basePrice > 1000 ? 15.0 : (basePrice > 100 ? 0.05 : 0.0002);
  const change = (Math.random() - 0.5) * scale;
  const nextPrice = Math.max(0.0001, basePrice + change);

  latestCandle.close = nextPrice;
  if (nextPrice > latestCandle.high) latestCandle.high = nextPrice;
  if (nextPrice < latestCandle.low) latestCandle.low = nextPrice;

  prices[currentPair] = nextPrice;
  
  updateUI();
  renderOwnChart();
}

function changePair() {
  currentPair = document.getElementById("pair").value;
  generateOwnHistory();
  updateUI();
  renderOwnChart();
}

function updateUI() {
  document.getElementById("balance").innerText = `$${balances[currentEnvironment].toLocaleString(undefined, {minimumFractionDigits: 2})}`;
  document.getElementById("price").innerText = prices[currentPair].toFixed(getPipPrecision(currentPair));
}

/* Authentication Processing Overlay Subroutines */
function openAuthModal(view) {
  const container = document.getElementById("modalFormContainer");
  document.getElementById("authModal").classList.remove("hidden");

  if (view === 'login') {
    container.innerHTML = `
      <div class="auth-title"><h2>Secure Sign In</h2><p class="subtitle">Access your live trading workspace</p></div>
      <p id="modalError" class="error-msg hidden"></p>
      <form onsubmit="submitAuth(event, 'login')">
        <div class="input-group"><label>User ID</label><input type="text" id="auth_user" required placeholder="institutional_id"></div>
        <div class="input-group"><label>Password</label><input type="password" id="auth_pass" required placeholder="••••••••"></div>
        <button type="submit" class="btn btn-primary" style="width:100%">Verify Credentials</button>
      </form>
      <p style="margin-top:1.25rem; text-align:center; font-size:0.8rem; color:var(--text-muted)">
        New operative? <span class="form-link" onclick="openAuthModal('register')">Register portal account</span>
      </p>`;
  } else {
    container.innerHTML = `
      <div class="auth-title"><h2>Establish Credentials</h2><p class="subtitle">Create secondary secure user tracking</p></div>
      <p id="modalError" class="error-msg hidden"></p>
      <form onsubmit="submitAuth(event, 'register')">
        <div class="input-group"><label>Account ID</label><input type="text" id="auth_user" required placeholder="institutional_id"></div>
        <div class="input-group"><label>Password</label><input type="password" id="auth_pass" required placeholder="Min 8 characters"></div>
        <div class="input-group"><label>Confirm Signature</label><input type="password" id="auth_confirm" required placeholder="••••••••"></div>
        <button type="submit" class="btn btn-primary" style="width:100%">Deploy Keys</button>
      </form>
      <p style="margin-top:1.25rem; text-align:center; font-size:0.8rem; color:var(--text-muted)">
        Already registered? <span class="form-link" onclick="openAuthModal('login')">Authorized entry here</span>
      </p>`;
  }
}

function closeAuthModal() { document.getElementById("authModal").classList.add("hidden"); }

function submitAuth(event, type) {
  event.preventDefault();
  const user = document.getElementById("auth_user").value.trim();
  const pass = document.getElementById("auth_pass").value;
  const errorEl = document.getElementById("modalError");

  if (type === 'register') {
    const confirmPass = document.getElementById("auth_confirm").value;
    if (pass.length < 8) { errorEl.innerText = "Security requirement: Password must be 8+ characters."; errorEl.classList.remove("hidden"); return; }
    if (pass !== confirmPass) { errorEl.innerText = "Configuration failure: Passwords mismatch."; errorEl.classList.remove("hidden"); return; }
  }

  isAuthenticated = true;
  activeUser = user;
  balances.REAL = 25000.00; // Inject starting real account funds simulation matrix
  closeAuthModal();
  
  // Update main container navigation buttons to dashboard tracking view
  document.getElementById("authHeaderActions").innerHTML = `
    <span style="margin-right:15px; color:var(--text-muted); font-size:0.85rem; align-self:center">Live Profile: <strong style="color:var(--warning)">${user}</strong></span>
    <button class="btn btn-secondary btn-sm" onclick="logout()">Disconnect</button>
  `;
  
  // Force switch to live account workspace automatically following successful authentication
  switchEnvironment("REAL");
}

function logout() { window.location.reload(); }

function addHistoryRecord(action, pair, volume, executionPrice, env) {
  const historyContainer = document.getElementById("history");
  const emptyPlaceholder = historyContainer.querySelector('.ledger-empty');
  if (emptyPlaceholder) emptyPlaceholder.remove();

  const timestamp = new Date().toLocaleTimeString();
  const envClass = env === "REAL" ? "color:var(--warning)" : "color:var(--primary)";
  const actionClass = action === "BUY" ? "color:var(--success)" : "color:var(--danger)";

  const li = document.createElement("li");
  li.innerHTML = `
    <span>[${timestamp}] <strong style="${envClass}">[${env}]</strong> <strong style="${actionClass}">${action}</strong> ${pair}</span>
    <span>Size: $${volume.toFixed(2)} @ Price: ${executionPrice}</span>
  `;
  historyContainer.insertBefore(li, historyContainer.firstChild);
}

// Initial Boot Strapping Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  generateOwnHistory();
  updateUI();
  
  setTimeout(() => {
    renderOwnChart();
    setInterval(streamNativeTick, 1000);
  }, 100);

  window.addEventListener("resize", renderOwnChart);
});
