// App State
let isAuthenticated = false; 
let balance = 10000.00;
const prices = { "EUR/USD": 1.1000, "GBP/USD": 1.2500, "USD/JPY": 145.00, "BTC/USD": 65000.00 };
let currentPair = "EUR/USD";

// Charting Engine State Handles
let chart = null;
let candleSeries = null;
let currentBar = null;
let lastBarTime = null;

function getPipPrecision(pair) {
  return (pair === "USD/JPY" || pair === "BTC/USD") ? 2 : 4;
}

// Initialize Candlestick Chart Framework Canvas
function initChart() {
  const chartElement = document.getElementById('chart');
  
  chart = LightweightCharts.createChart(chartElement, {
    layout: {
      background: { type: 'solid', color: '#1e293b' },
      textColor: '#94a3b8',
    },
    grid: {
      vertLines: { color: 'rgba(51, 65, 85, 0.5)' },
      horzLines: { color: 'rgba(51, 65, 85, 0.5)' },
    },
    crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
    rightPriceScale: { borderColor: '#334155' },
    timeScale: { borderColor: '#334155', timeVisible: true, secondsVisible: false },
  });

  candleSeries = chart.addCandlestickSeries({
    upColor: '#10b981', downColor: '#ef4444',
    borderUpColor: '#10b981', borderDownColor: '#ef4444',
    wickUpColor: '#10b981', wickDownColor: '#ef4444',
  });

  generateMockHistory();

  // Watch for layout viewport changes to scale structural frames smoothly
  new ResizeObserver(() => {
    chart.applyOptions({ width: chartElement.clientWidth, height: chartElement.clientHeight });
  }).observe(chartElement);
}

// Generate Historical Placeholder Bars based on the Target Asset
function generateMockHistory() {
  const basePrice = prices[currentPair];
  let mockData = [];
  const totalBars = 60; // Render 60 pre-existing data bars 
  let timeTracker = Math.floor(Date.now() / 1000) - (totalBars * 60);

  let rollingClose = basePrice;
  const varianceFactor = basePrice > 1000 ? 25 : (basePrice > 100 ? 0.15 : 0.001);

  for (let i = 0; i < totalBars; i++) {
    let open = rollingClose;
    let close = open + ((Math.random() - 0.5) * varianceFactor);
    let high = Math.max(open, close) + (Math.random() * (varianceFactor / 2));
    let low = Math.min(open, close) - (Math.random() * (varianceFactor / 2));

    mockData.push({ time: timeTracker, open, high, low, close });
    rollingClose = close;
    timeTracker += 60;
  }

  candleSeries.setData(mockData);
  
  // Set up pointer hooks targeting state changes inside execution loops
  currentBar = { ...mockData[mockData.length - 1] };
  lastBarTime = currentBar.time;
  prices[currentPair] = currentBar.close;
}

// Regenerate market perspectives on selection transitions
function changePair() {
  currentPair = document.getElementById("pair").value;
  generateMockHistory();
  updateUI();
}

// Streaming Core Price Updates into Live Candlesticks 
function streamMarketTick() {
  const basePrice = prices[currentPair];
  const scaleFactor = basePrice > 1000 ? 15.0 : (basePrice > 100 ? 0.05 : 0.0002);
  const change = (Math.random() - 0.5) * scaleFactor;
  
  const nextPrice = Math.max(0.0001, basePrice + change);
  prices[currentPair] = nextPrice;

  const currentTime = Math.floor(Date.now() / 1000);
  const currentMinuteWindow = currentTime - (currentTime % 60);

  if (currentMinuteWindow > lastBarTime) {
    // Construct a brand-new processing bar window
    currentBar = {
      time: currentMinuteWindow,
      open: nextPrice,
      high: nextPrice,
      low: nextPrice,
      close: nextPrice
    };
    lastBarTime = currentMinuteWindow;
  } else {
    // Expand parameters mapping to the current active candle bar window
    currentBar.close = nextPrice;
    if (nextPrice > currentBar.high) currentBar.high = nextPrice;
    if (nextPrice < currentBar.low) currentBar.low = nextPrice;
  }

  candleSeries.update(currentBar);
  updateUI();
}

function updateUI() {
  document.getElementById("balance").innerText = `$${balance.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
  document.getElementById("price").innerText = prices[currentPair].toFixed(getPipPrecision(currentPair));
}

/* Order Execution Gateways */
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

/* Auth Views Framework Modals Overlay UI Router Engine */
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

// Launch application scripts on complete window initialization loops
window.onload = () => {
  initChart();
  setInterval(streamMarketTick, 1000); // Clock high-frequency ticks every 1 second
  updateUI();
};
