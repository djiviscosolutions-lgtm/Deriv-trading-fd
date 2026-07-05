// Global App Configuration
let isAuthenticated = false; 
let balance = 10000.00;
const prices = { "EUR/USD": 1.1000, "GBP/USD": 1.2500, "USD/JPY": 145.00, "BTC/USD": 65000.00 };
let currentPair = "EUR/USD";

// Custom Canvas State Configuration Arrays
let mockHistory = [];
const maxVisibleCandles = 35; // Number of bars visible on screen simultaneously

function getPipPrecision(pair) {
  return (pair === "USD/JPY" || pair === "BTC/USD") ? 2 : 4;
}

// Generate Proprietary In-Memory Historical Arrays
function generateOwnHistory() {
  mockHistory = [];
  let basePrice = prices[currentPair];
  const variance = basePrice > 1000 ? 40 : (basePrice > 100 ? 0.25 : 0.0015);
  
  let rollingClose = basePrice;
  for (let i = 0; i < maxVisibleCandles; i++) {
    let open = rollingClose;
    let close = open + ((Math.random() - 0.5) * variance);
    let high = Math.max(open, close) + (Math.random() * (variance / 1.8));
    let low = Math.min(open, close) - (Math.random() * (variance / 1.8));

    mockHistory.push({ open, high, low, close });
    rollingClose = close;
  }
  // Balance latest snapshot values to the current position tracker
  prices[currentPair] = mockHistory[mockHistory.length - 1].close;
}

// Proprietary 2D Math Canvas Rendering Engine
function renderOwnChart() {
  const canvas = document.getElementById("customChart");
  const wrapper = document.getElementById("chartWrapper");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  
  // Set explicit dynamic canvas resolution properties to avoid scaling blur
  const rect = wrapper.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  const width = canvas.width;
  const height = canvas.height;
  const paddingRight = 70; // Reserve workspace margin area for pricing scale rulers
  const paddingTopBottom = 30;
  const chartWidth = width - paddingRight;
  const chartHeight = height - (paddingTopBottom * 2);

  // Clear Canvas frames prior to redrawing loops
  ctx.fillStyle = "#0b0f19";
  ctx.fillRect(0, 0, width, height);

  if (mockHistory.length === 0) return;

  // Step 1: Scan for localized high/low points to establish vertical dynamic bounding boxes
  let maxPrice = Math.max(...mockHistory.map(c => c.high));
  let minPrice = Math.min(...mockHistory.map(c => c.low));
  
  // Prevent zero-division errors if prices flatten out completely
  if (maxPrice === minPrice) {
    maxPrice += 0.01;
    minPrice -= 0.01;
  }

  // Inject buffer padding ranges inside top/bottom chart edges
  const priceRange = maxPrice - minPrice;
  maxPrice += priceRange * 0.05;
  minPrice -= priceRange * 0.05;
  const adjustedRange = maxPrice - minPrice;

  // Step 2: Draw horizontal grid line parameters across backgrounds
  ctx.strokeStyle = "rgba(51, 65, 85, 0.25)";
  ctx.lineWidth = 1;
  ctx.font = "11px monospace";
  ctx.fillStyle = "#94a3b8";

  const gridLinesCount = 4;
  for (let i = 0; i <= gridLinesCount; i++) {
    const y = paddingTopBottom + (chartHeight * (i / gridLinesCount));
    const priceValue = maxPrice - (adjustedRange * (i / gridLinesCount));

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(chartWidth, y);
    ctx.stroke();

    // Text output parameters mapping to the scale values
    ctx.fillText(priceValue.toFixed(getPipPrecision(currentPair)), chartWidth + 8, y + 4);
  }

  // Step 3: Loop and map coordinate points to render every candlestick
  const candleSpacing = chartWidth / maxVisibleCandles;
  const candleWidth = candleSpacing * 0.7;

  for (let i = 0; i < mockHistory.length; i++) {
    const candle = mockHistory[i];
    const isBullish = candle.close >= candle.open;

    // Map math coordinates cleanly to canvas pixels
    const x = (i * candleSpacing) + (candleSpacing - candleWidth) / 2;
    const yOpen = paddingTopBottom + chartHeight * (1 - (candle.open - minPrice) / adjustedRange);
    const yClose = paddingTopBottom + chartHeight * (1 - (candle.close - minPrice) / adjustedRange);
    const yHigh = paddingTopBottom + chartHeight * (1 - (candle.high - minPrice) / adjustedRange);
    const yLow = paddingTopBottom + chartHeight * (1 - (candle.low - minPrice) / adjustedRange);

    const candleColor = isBullish ? "#10b981" : "#ef4444";
    ctx.strokeStyle = candleColor;
    ctx.fillStyle = candleColor;

    // Draw the Wick (Vertical high-low range line)
    ctx.beginPath();
    ctx.moveTo(x + (candleWidth / 2), yHigh);
    ctx.lineTo(x + (candleWidth / 2), yLow);
    ctx.stroke();

    // Draw Candle Body block rectangles
    const top = Math.min(yOpen, yClose);
    const bodyHeight = Math.max(1, Math.abs(yOpen - yClose)); // Guarantee a 1px minimum height
    ctx.fillRect(x, top, candleWidth, bodyHeight);
  }
}

// Push live variations into memory objects
function streamNativeTick() {
  if (mockHistory.length === 0) return;

  const latestIndex = mockHistory.length - 1;
  let activeCandle = mockHistory[latestIndex];
  
  const basePrice = activeCandle.close;
  const scale = basePrice > 1000 ? 12.0 : (basePrice > 100 ? 0.04 : 0.00015);
  const change = (Math.random() - 0.5) * scale;
  const nextPrice = Math.max(0.0001, basePrice + change);

  // Update calculation states on our latest candle object
  activeCandle.close = nextPrice;
  if (nextPrice > activeCandle.high) activeCandle.high = nextPrice;
  if (nextPrice < activeCandle.low) activeCandle.low = nextPrice;

  prices[currentPair] = nextPrice;
  
  updateUI();
  renderOwnChart();
}

// Shuffle historical datasets on active select conversions
function changePair() {
  currentPair = document.getElementById("pair").value;
  generateOwnHistory();
  updateUI();
  renderOwnChart();
}

function updateUI() {
  document.getElementById("balance").innerText = `$${balance.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
  document.getElementById("price").innerText = prices[currentPair].toFixed(getPipPrecision(currentPair));
}

/* Internal Account Processing Infrastructure */
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

/* Gateway Modals Controllers */
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

function closeAuthModal() { document.getElementById("authModal").classList.add("hidden"); }

function submitAuth(event, type) {
  event.preventDefault();
  const user = document.getElementById("auth_user").value.trim();
  const pass = document.getElementById("auth_pass").value;
  const errorEl = document.getElementById("modalError");

  if (type === 'register') {
    const confirmPass = document.getElementById("auth_confirm").value;
    if (pass.length < 8) { errorEl.innerText = "Password must be at least 8 characters."; errorEl.classList.remove("hidden"); return; }
    if (pass !== confirmPass) { errorEl.innerText = "Passwords do not match."; errorEl.classList.remove("hidden"); return; }
  }

  isAuthenticated = true;
  closeAuthModal();
  
  document.getElementById("authHeaderActions").innerHTML = `
    <span style="margin-right:15px; color:var(--text-muted); align-self:center">Active: <strong>${user}</strong></span>
    <button class="btn btn-secondary btn-sm" onclick="logout()">Logout</button>
  `;
  document.getElementById("tradeMsg").innerText = "Successfully logged in. Execution features unlocked.";
  document.getElementById("tradeMsg").style.color = "var(--success)";
}

function logout() { window.location.reload(); }

function addHistoryRecord(action, pair, volume, executionPrice) {
  const historyContainer = document.getElementById("history");
  const emptyPlaceholder = historyContainer.querySelector('.ledger-empty');
  if (emptyPlaceholder) emptyPlaceholder.remove();

  const timestamp = new Date().toLocaleTimeString();
  const li = document.createElement("li");
  li.innerHTML = `<span>[${timestamp}] <strong>${action}</strong> ${pair}</span><span>Vol: $${volume.toFixed(2)} @ ${executionPrice}</span>`;
  historyContainer.insertBefore(li, historyContainer.firstChild);
}

// App Entry Points Initialization Loops
document.addEventListener("DOMContentLoaded", () => {
  generateOwnHistory();
  updateUI();
  
  // Timeout wrapper avoids window dimension evaluation failures during fast loads
  setTimeout(() => {
    renderOwnChart();
    // Fire high frequency price ticks every second
    setInterval(streamNativeTick, 1000);
  }, 150);

  // Redraw structural grids automatically if user tilts device or expands terminal window panels
  window.addEventListener("resize", renderOwnChart);
});
