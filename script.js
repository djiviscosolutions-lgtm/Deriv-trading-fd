// Application Central Architecture State Matrix
let currentEnvironment = "DEMO"; 
let isAuthenticated = false; 
let activeUser = "";

let balances = { DEMO: 50000.00, REAL: 0.00 };
const prices = { "EUR/USD": 1.1000, "GBP/USD": 1.2500, "USD/JPY": 145.00, "BTC/USD": 65000.00 };
let currentPair = "EUR/USD";

// Dynamic Layout Object Containers
let mockHistory = [];
const maxVisibleCandles = 45;
let activePositions = []; // Tracks structural order arrays: { id, env, pair, type, entryPrice, volume }
let positionIdCounter = 1001;

function getPipPrecision(pair) {
  return (pair === "USD/JPY" || pair === "BTC/USD") ? 2 : 4;
}

// Convert Active Environment Channels
function switchEnvironment(env) {
  currentEnvironment = env;
  
  document.getElementById("demoBtn").classList.toggle("active", env === "DEMO");
  document.getElementById("realBtn").classList.toggle("active", env === "REAL");
  
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
  updateUI();
  renderOwnChart();
  renderPositionsTable();
}

// Order Desk Routing Engines
function executeMarketOrder(type) {
  const statusMsg = document.getElementById("tradeMsg");
  statusMsg.innerText = "";

  // security validation guard check
  if (currentEnvironment === "REAL" && !isAuthenticated) {
    statusMsg.innerText = "Access Blocked: Live trading requires verification.";
    statusMsg.style.color = "var(--danger)";
    openAuthModal('login');
    return;
  }

  const amountInput = document.getElementById("amount");
  const amount = parseFloat(amountInput.value);

  if (isNaN(amount) || amount <= 0) {
    statusMsg.innerText = "Error: Input functional order execution size.";
    statusMsg.style.color = "var(--danger)";
    return;
  }

  let currentBalance = balances[currentEnvironment];
  if (amount > currentBalance) {
    statusMsg.innerText = "Cancelled: Insufficient account margin depths.";
    statusMsg.style.color = "var(--danger)";
    return;
  }

  const executionPrice = prices[currentPair];

  // Deduct asset collateral margins directly from active account tiers
  balances[currentEnvironment] -= amount;

  // Insert position into engine tracking array
  const newPosition = {
    id: positionIdCounter++,
    env: currentEnvironment,
    pair: currentPair,
    type: type,
    entryPrice: executionPrice,
    volume: amount
  };

  activePositions.push(newPosition);
  statusMsg.innerText = `${type} Contract Deployed at ${executionPrice.toFixed(getPipPrecision(currentPair))}`;
  statusMsg.style.color = type === "BUY" ? "var(--success)" : "var(--warning)";

  updateUI();
  renderPositionsTable();
  renderOwnChart(); // Instantly update chart to render execution track arrays
}

// Liquidate Active Market Positions (One-Click Liquidation Engine)
function closePosition(id) {
  const index = activePositions.findIndex(p => p.id === id);
  if (index === -1) return;

  const pos = activePositions[index];
  const exitPrice = prices[pos.pair];
  const pnl = calculatePositionPnL(pos, exitPrice);

  // Return original collateral size + real time profits/losses
  balances[pos.env] += (pos.volume + pnl);

  // Log to history ledger strings
  addHistoryRecord(pos.type, pos.pair, pos.volume, pos.entryPrice, exitPrice, pnl, pos.env);

  // Splice tracking metrics array array
  activePositions.splice(index, 1);

  updateUI();
  renderPositionsTable();
  renderOwnChart();
}

// High Fidelity Mathematical PnL Calculations
function calculatePositionPnL(pos, currentPrice) {
  const precision = getPipPrecision(pos.pair);
  let multiplier = pos.pair === "BTC/USD" ? 0.1 : (pos.pair === "USD/JPY" ? 50 : 5000); 
  
  let difference = 0;
  if (pos.type === "BUY") {
    difference = currentPrice - pos.entryPrice;
  } else {
    difference = pos.entryPrice - currentPrice;
  }
  
  return difference * multiplier * (pos.volume / 1000);
}

// Dynamic Position Tables Render Engine
function renderPositionsTable() {
  const tbody = document.getElementById("activePositionsTableBody");
  tbody.innerHTML = "";

  // Filter out calculations context based on parameters matches
  const visiblePositions = activePositions.filter(p => p.env === currentEnvironment);

  if (visiblePositions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="table-empty-row">No active working positions in this account.</td></tr>`;
    return;
  }

  visiblePositions.forEach(pos => {
    const currentPrice = prices[pos.pair];
    const pnl = calculatePositionPnL(pos, currentPrice);
    const pnlClass = pnl >= 0 ? "pnl-positive" : "pnl-negative";
    const precision = getPipPrecision(pos.pair);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>#${pos.id}</td>
      <td><span class="badge ${pos.env === 'REAL' ? 'real-badge' : 'demo-badge'}">${pos.env}</span></td>
      <td><strong>${pos.pair}</strong></td>
      <td><span style="color:${pos.type === 'BUY' ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${pos.type}</span></td>
      <td>${pos.entryPrice.toFixed(precision)}</td>
      <td>$${pos.volume.toFixed(2)}</td>
      <td>${currentPrice.toFixed(precision)}</td>
      <td class="${pnlClass}">$${pnl.toFixed(2)}</td>
      <td><button class="btn-close-position" onclick="closePosition(${pos.id})">Liquidate</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// Native Canvas Engine with Dynamic Trade Coordinate Interceptors
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
  const paddingRight = 85; 
  const paddingTopBottom = 30;
  const chartWidth = width - paddingRight;
  const chartHeight = height - (paddingTopBottom * 2);

  ctx.fillStyle = "#03050a";
  ctx.fillRect(0, 0, width, height);

  if (mockHistory.length === 0) return;

  let maxPrice = Math.max(...mockHistory.map(c => c.high));
  let minPrice = Math.min(...mockHistory.map(c => c.low));

  // Also include open position entry ticks inside coordinate bounds mapping rules to keep lines visible on graphs
  activePositions.forEach(p => {
    if (p.env === currentEnvironment && p.pair === currentPair) {
      if (p.entryPrice > maxPrice) maxPrice = p.entryPrice;
      if (p.entryPrice < minPrice) minPrice = p.entryPrice;
    }
  });
  
  const priceRange = maxPrice - minPrice || 0.01;
  maxPrice += priceRange * 0.06;
  minPrice -= priceRange * 0.06;
  const adjustedRange = maxPrice - minPrice;

  // Render Horizontal Ruler Grid Arrays
  ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
  ctx.lineWidth = 1;
  ctx.font = "10px Courier New";
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

  // Draw Candlestick Structures
  const candleSpacing = chartWidth / maxVisibleCandles;
  const candleWidth = candleSpacing * 0.75;

  for (let i = 0; i < mockHistory.length; i++) {
    const candle = mockHistory[i];
    const isBullish = candle.close >= candle.open;

    const x = (i * candleSpacing) + (candleSpacing - candleWidth) / 2;
    const yOpen = paddingTopBottom + chartHeight * (1 - (candle.open - minPrice) / adjustedRange);
    const yClose = paddingTopBottom + chartHeight * (1 - (candle.close - minPrice) / adjustedRange);
    const yHigh = paddingTopBottom + chartHeight * (1 - (candle.high - minPrice) / adjustedRange);
    const yLow = paddingTopBottom + chartHeight * (1 - (candle.low - minPrice) / adjustedRange);

    const color = isBullish ? "#00b074" : "#ff3b57";
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

  // DYNAMIC LAYER: Draw Open Positions Entry Coordinate Lines Directly Across the Canvas
  activePositions.forEach(pos => {
    if (pos.env !== currentEnvironment || pos.pair !== currentPair) return;

    // Determine spatial Y pixel mappings
    const yPos = paddingTopBottom + chartHeight * (1 - (pos.entryPrice - minPrice) / adjustedRange);
    const color = pos.type === "BUY" ? "#10b981" : "#f43f5e";

    // Draw horizontal dotted line tracking the entry price
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]); // Creates dynamic dashed stroke configuration rules
    ctx.beginPath();
    ctx.moveTo(0, yPos);
    ctx.lineTo(chartWidth, yPos);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line options

    // Draw floating text flag tracking real-time status markers
    const currentPrice = prices[pos.pair];
    const pnl = calculatePositionPnL(pos, currentPrice);

    ctx.fillStyle = color;
    ctx.fillRect(5, yPos - 10, 160, 20);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText(`${pos.type} #${pos.id}: PnL $${pnl.toFixed(2)}`, 10, yPos + 4);
  });
}

// Live High-Frequency Price Feed Simulation Loops
function streamNativeTick() {
  if (mockHistory.length === 0) return;

  const latestCandle = mockHistory[mockHistory.length - 1];
  const basePrice = latestCandle.close;
  const scale = basePrice > 1000 ? 18.0 : (basePrice > 100 ? 0.06 : 0.00025);
  const change = (Math.random() - 0.5) * scale;
  const nextPrice = Math.max(0.0001, basePrice + change);

  latestCandle.close = nextPrice;
  if (nextPrice > latestCandle.high) latestCandle.high = nextPrice;
  if (nextPrice < latestCandle.low) latestCandle.low = nextPrice;

  prices[currentPair] = nextPrice;
  
  updateUI();
  renderPositionsTable(); // Re-evaluate active position tables metrics live on every update tick
  renderOwnChart();
}

function changePair() {
  currentPair = document.getElementById("pair").value;
  document.getElementById("activeAssetLabel").innerText = currentPair;
  generateOwnHistory();
  updateUI();
  renderOwnChart();
  renderPositionsTable();
}

function updateUI() {
  document.getElementById("balance").innerText = `$${balances[currentEnvironment].toLocaleString(undefined, {minimumFractionDigits: 2})}`;
  document.getElementById("price").innerText = prices[currentPair].toFixed(getPipPrecision(currentPair));
}

/* Modal Authentication Subroutines */
function openAuthModal(view) {
  const container = document.getElementById("modalFormContainer");
  document.getElementById("authModal").classList.remove("hidden");

  if (view === 'login') {
    container.innerHTML = `
      <div class="auth-title"><h2>Terminal Authentication</h2><p class="subtitle">Access Live Ledger Clearing Matrix</p></div>
      <p id="modalError" class="error-msg hidden"></p>
      <form onsubmit="submitAuth(event, 'login')">
        <div class="input-group"><label>Trader ID</label><input type="text" id="auth_user" required placeholder="clearing_id_pro"></div>
        <div class="input-group"><label>Signature Keys</label><input type="password" id="auth_pass" required placeholder="••••••••"></div>
        <button type="submit" class="btn btn-primary" style="width:100%">Verify Exchange access</button>
      </form>
      <p style="margin-top:1.25rem; text-align:center; font-size:0.8rem; color:var(--text-muted)">
        New account? <span class="form-link" onclick="openAuthModal('register')">Register secure node</span>
      </p>`;
  } else {
    container.innerHTML = `
      <div class="auth-title"><h2>Deploy Secure Node</h2><p class="subtitle">Generate encrypted private trade signature keys</p></div>
      <p id="modalError" class="error-msg hidden"></p>
      <form onsubmit="submitAuth(event, 'register')">
        <div class="input-group"><label>Desired ID</label><input type="text" id="auth_user" required placeholder="clearing_id_pro"></div>
        <div class="input-group"><label>Passphrase</label><input type="password" id="auth_pass" required placeholder="Min 8 characters"></div>
        <div class="input-group"><label>Confirm Passphrase</label><input type="password" id="auth_confirm" required placeholder="••••••••"></div>
        <button type="submit" class="btn btn-primary" style="width:100%">Create Exchange Entry Node</button>
      </form>
      <p style="margin-top:1.25rem; text-align:center; font-size:0.8rem; color:var(--text-muted)">
        Already setup? <span class="form-link" onclick="openAuthModal('login')">Decrypt portal here</span>
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
    if (pass.length < 8) { errorEl.innerText = "Error: Key length must be 8+ characters."; errorEl.classList.remove("hidden"); return; }
    if (pass !== confirmPass) { errorEl.innerText = "Error: Signatures do not match."; errorEl.classList.remove("hidden"); return; }
  }

  isAuthenticated = true;
  activeUser = user;
  balances.REAL = 10000.00; // Starting funding simulation matrix
  closeAuthModal();
  
  document.getElementById("authHeaderActions").innerHTML = `
    <span style="margin-right:12px; color:var(--text-muted); font-size:0.8rem; align-self:center">Live Profile: <strong style="color:var(--warning)">${user}</strong></span>
    <button class="btn btn-secondary btn-sm" onclick="logout()">Disconnect</button>
  `;
  switchEnvironment("REAL");
}

function logout() { window.location.reload(); }

function addHistoryRecord(action, pair, volume, entry, exit, pnl, env) {
  const historyContainer = document.getElementById("history");
  const emptyPlaceholder = historyContainer.querySelector('.ledger-empty');
  if (emptyPlaceholder) emptyPlaceholder.remove();

  const timestamp = new Date().toLocaleTimeString();
  const envClass = env === "REAL" ? "color:var(--warning)" : "color:var(--primary)";
  const actionClass = action === "BUY" ? "color:var(--success)" : "color:var(--danger)";
  const pnlClass = pnl >= 0 ? "color:#10b981" : "color:#f43f5e";

  const li = document.createElement("li");
  li.innerHTML = `
    <span>[${timestamp}] <strong style="${envClass}">[${env}]</strong> <strong style="${actionClass}">${action}</strong> ${pair}</span>
    <span>In: ${entry.toFixed(getPipPrecision(pair))} &rarr; Out: ${exit.toFixed(getPipPrecision(pair))} | Vol: $${volume.toFixed(2)} | <strong style="${pnlClass}">PnL: $${pnl.toFixed(2)}</strong></span>
  `;
  historyContainer.insertBefore(li, historyContainer.firstChild);
}

// Initial Core Boot Strapping Routines
document.addEventListener("DOMContentLoaded", () => {
  generateOwnHistory();
  updateUI();
  
  setTimeout(() => {
    renderOwnChart();
    setInterval(streamNativeTick, 1000); // 1-second clean ticking update loops
  }, 100);

  window.addEventListener("resize", renderOwnChart);
});
