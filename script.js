// Application Central Configurations
let currentEnvironment = "DEMO"; 
let isAuthenticated = false; 
let activeUser = "";

let balances = { DEMO: 50000.00, REAL: 0.00 };
const prices = { "EUR/USD": 1.1000, "GBP/USD": 1.2500, "USD/JPY": 145.00, "BTC/USD": 65000.00 };
let currentPair = "EUR/USD";

// EXTENDED DATA SYSTEM MATRIX FOR ARCHIVE PANNING OPERATIONS
let mockHistory = [];
const totalGeneratedCandles = 500; // Large depth allocation pool for back-panning exploration
let visibleCandlesCount = 50;      // Current zoom scale
let currentScrollOffset = 0;       // Horizontal panning index tracker value

// Dragging Interactions State Tracking Mechanics
let isDragging = false;
let dragStartX = 0;
let dragStartOffset = 0;

let activePositions = []; 
let positionIdCounter = 40001;

function getPipPrecision(pair) {
  return (pair === "USD/JPY" || pair === "BTC/USD") ? 2 : 4;
}

// Operational Framework UI Toggle
function toggleOrderInputLayout() {
  const framework = document.getElementById("tradeTypeSelect").value;
  document.getElementById("spotInputContainer").classList.toggle("hidden", framework !== "SPOT");
  document.getElementById("durationInputContainer").classList.toggle("hidden", framework !== "DURATION");
}

function switchEnvironment(env) {
  currentEnvironment = env;
  document.getElementById("demoBtn").classList.toggle("active", env === "DEMO");
  document.getElementById("realBtn").classList.toggle("active", env === "REAL");
  
  document.getElementById("balanceLabel").innerText = env === "DEMO" ? "Demo Balance" : "Live Vault Balance";
  const badge = document.getElementById("chartFeedBadge");
  badge.innerText = `${env} Feed`;
  badge.className = `badge ${env === 'REAL' ? 'real-badge' : 'demo-badge'}`;

  document.getElementById("tradeMsg").innerText = "";
  updateUI();
  renderPositionsTable();
  renderOwnChart();
}

// Multi-Framework Forex Position Execution Node
function executeForexOrder(orderDirection) {
  const statusMsg = document.getElementById("tradeMsg");
  statusMsg.innerText = "";

  if (currentEnvironment === "REAL" && !isAuthenticated) {
    statusMsg.innerText = "Execution Denied: Node must be verified for Live market access.";
    statusMsg.style.color = "var(--danger)";
    openAuthModal('login');
    return;
  }

  const amount = parseFloat(document.getElementById("amount").value);
  if (isNaN(amount) || amount < 10) {
    statusMsg.innerText = "Parameter Error: Minimum investment limit is $10.";
    statusMsg.style.color = "var(--danger)";
    return;
  }

  if (amount > balances[currentEnvironment]) {
    statusMsg.innerText = "Risk Canceled: Insufficient accounting margin limits.";
    statusMsg.style.color = "var(--danger)";
    return;
  }

  const frameworkType = document.getElementById("tradeTypeSelect").value;
  const executionPrice = prices[currentPair];
  let contractRules = {};

  if (frameworkType === "SPOT") {
    // Collect Spot Stop Loss and Take Profit input variables
    const slPips = parseFloat(document.getElementById("stopLossInput").value);
    const tpPips = parseFloat(document.getElementById("takeProfitInput").value);
    
    if (isNaN(slPips) || isNaN(tpPips) || slPips < 5 || tpPips < 5) {
      statusMsg.innerText = "Risk Validation Error: Minimum boundary rules must exceed 5 pips.";
      statusMsg.style.color = "var(--danger)";
      return;
    }

    const pipSize = currentPair === "USD/JPY" ? 0.01 : (currentPair === "BTC/USD" ? 1.0 : 0.0001);
    
    // Mathematically establish target boundary lines depending on long/short selection vectors
    const slOffset = slPips * pipSize;
    const tpOffset = tpPips * pipSize;

    contractRules.slPrice = orderDirection === "BUY" ? (executionPrice - slOffset) : (executionPrice + slOffset);
    contractRules.tpPrice = orderDirection === "BUY" ? (executionPrice + tpOffset) : (executionPrice - tpOffset);
    contractRules.framework = "SPOT";
  } else {
    // Collect Duration Expiration metrics
    const expirySeconds = parseInt(document.getElementById("durationInput").value);
    if (isNaN(expirySeconds) || expirySeconds < 10) {
      statusMsg.innerText = "Error: Options duration window must be 10s minimum.";
      statusMsg.style.color = "var(--danger)";
      return;
    }
    contractRules.framework = "DURATION";
    contractRules.expirationTime = Date.now() + (expirySeconds * 1000);
  }

  // Deduct allocation from wallet balance pools
  balances[currentEnvironment] -= amount;

  const newContract = {
    id: positionIdCounter++,
    env: currentEnvironment,
    pair: currentPair,
    type: orderDirection,
    entryPrice: executionPrice,
    volume: amount,
    rules: contractRules
  };

  activePositions.push(newContract);
  statusMsg.innerText = `Contract Transacted [${frameworkType}] @ ${executionPrice.toFixed(getPipPrecision(currentPair))}`;
  statusMsg.style.color = "var(--success)";

  // Automatically snap viewport focus back to live feed if tracking far behind history pages
  currentScrollOffset = 0;

  updateUI();
  renderPositionsTable();
  renderOwnChart();
}

// Close/Liquidate/Settle active positions out of processing pipelines
function closePosition(id, autoTriggerReason = "") {
  const index = activePositions.findIndex(p => p.id === id);
  if (index === -1) return;

  const pos = activePositions[index];
  const exitPrice = prices[pos.pair];
  const pnl = calculatePositionPnL(pos, exitPrice);

  // Credit asset margins back into client balances
  balances[pos.env] += (pos.volume + pnl);
  
  addHistoryRecord(pos.type, pos.pair, pos.volume, pos.entryPrice, exitPrice, pnl, pos.env, autoTriggerReason || "MANUAL CLOSE");
  activePositions.splice(index, 1);

  updateUI();
  renderPositionsTable();
  renderOwnChart();
}

// High Fidelity Forex Profit/Loss Calculators
function calculatePositionPnL(pos, currentPrice) {
  let multiplier = pos.pair === "BTC/USD" ? 0.05 : (pos.pair === "USD/JPY" ? 40 : 4000);
  let difference = pos.type === "BUY" ? (currentPrice - pos.entryPrice) : (pos.entryPrice - currentPrice);
  
  if (pos.rules.framework === "DURATION") {
    // Fixed Premium Matrix Returns simulation like Deriv binaries
    if (Date.now() >= pos.rules.expirationTime) {
      return difference > 0 ? (pos.volume * 0.85) : (-pos.volume);
    }
    // Return unrealized linear projection metrics prior to resolution time-outs
    return difference >= 0 ? (pos.volume * 0.2) : (-pos.volume * 0.2);
  }

  return difference * multiplier * (pos.volume / 1000);
}

// Check Spot boundary line rule triggers and Duration Option timeouts
function evaluateRiskAutomations() {
  const currentTime = Date.now();

  for (let i = activePositions.length - 1; i >= 0; i--) {
    const pos = activePositions[i];
    const currentMarketPrice = prices[pos.pair];

    if (pos.rules.framework === "SPOT") {
      // Evaluate Stop Loss parameter breaks
      if (pos.type === "BUY" && currentMarketPrice <= pos.rules.slPrice) { closePosition(pos.id, "STOP LOSS AUTOCUT"); continue; }
      if (pos.type === "SELL" && currentMarketPrice >= pos.rules.slPrice) { closePosition(pos.id, "STOP LOSS AUTOCUT"); continue; }

      // Evaluate Take Profit parameter breaks
      if (pos.type === "BUY" && currentMarketPrice >= pos.rules.tpPrice) { closePosition(pos.id, "TAKE PROFIT TRIGGER"); continue; }
      if (pos.type === "SELL" && currentMarketPrice <= pos.rules.tpPrice) { closePosition(pos.id, "TAKE PROFIT TRIGGER"); continue; }
    } else if (pos.rules.framework === "DURATION") {
      if (currentTime >= pos.rules.expirationTime) {
        closePosition(pos.id, "CONTRACT EXPIRATION");
      }
    }
  }
}

function renderPositionsTable() {
  const tbody = document.getElementById("activePositionsTableBody");
  tbody.innerHTML = "";

  const currentDisplaySet = activePositions.filter(p => p.env === currentEnvironment);

  if (currentDisplaySet.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="table-empty-row">No active positions exposed to current volatility spikes.</td></tr>`;
    return;
  }

  currentDisplaySet.forEach(pos => {
    const currentPrice = prices[pos.pair];
    const pnl = calculatePositionPnL(pos, currentPrice);
    const pnlClass = pnl >= 0 ? "pnl-positive" : "pnl-negative";
    const precision = getPipPrecision(pos.pair);

    let rulesString = "";
    if (pos.rules.framework === "SPOT") {
      rulesString = `SL: ${pos.rules.slPrice.toFixed(precision)} | TP: ${pos.rules.tpPrice.toFixed(precision)}`;
    } else {
      const remainingSecs = Math.max(0, Math.ceil((pos.rules.expirationTime - Date.now()) / 1000));
      rulesString = `Expires in: ${remainingSecs}s`;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>#${pos.id}</td>
      <td><strong>${pos.pair}</strong></td>
      <td>${pos.rules.framework}</td>
      <td><span style="color:${pos.type === 'BUY' ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${pos.type}</span></td>
      <td>${pos.entryPrice.toFixed(precision)}</td>
      <td><span style="font-size:0.75rem; color:#94a3b8">${rulesString}</span></td>
      <td>$${pos.volume.toFixed(2)}</td>
      <td>${currentPrice.toFixed(precision)}</td>
      <td class="${pnlClass}">$${pnl.toFixed(2)}</td>
      <td><button class="btn-close-position" onclick="closePosition(${pos.id})">Liquidate</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// 2D Canvas Engine supporting Navigation, Panning, and Zooming Arrays
function generateLargeHistoryBuffer() {
  mockHistory = [];
  let basePrice = prices[currentPair];
  const variance = basePrice > 1000 ? 60 : (basePrice > 100 ? 0.35 : 0.0025);
  
  let rollingClose = basePrice;
  for (let i = 0; i < totalGeneratedCandles; i++) {
    let open = rollingClose;
    let close = open + ((Math.random() - 0.5) * variance);
    let high = Math.max(open, close) + (Math.random() * (variance / 2.2));
    let low = Math.min(open, close) - (Math.random() * (variance / 2.2));

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
  canvas.width = rect.width; canvas.height = rect.height;

  const width = canvas.width; const height = canvas.height;
  const paddingRight = 85; const paddingTopBottom = 30;
  const chartWidth = width - paddingRight; const chartHeight = height - (paddingTopBottom * 2);

  ctx.fillStyle = "#020408"; ctx.fillRect(0, 0, width, height);

  // Slice historical datasets based on current panning array pointers
  const endIndex = mockHistory.length - 1 - currentScrollOffset;
  const startIndex = Math.max(0, endIndex - visibleCandlesCount);
  const activeSlicingSubset = mockHistory.slice(startIndex, endIndex + 1);

  if (activeSlicingSubset.length === 0) return;

  let maxPrice = Math.max(...activeSlicingSubset.map(c => c.high));
  let minPrice = Math.min(...activeSlicingSubset.map(c => c.low));

  // Incorporate target rules boundary trackers inside mapping boxes to keep lines legible
  activePositions.forEach(p => {
    if (p.env === currentEnvironment && p.pair === currentPair) {
      if (p.entryPrice > maxPrice) maxPrice = p.entryPrice;
      if (p.entryPrice < minPrice) minPrice = p.entryPrice;
      if (p.rules.slPrice && p.rules.slPrice > maxPrice) maxPrice = p.rules.slPrice;
      if (p.rules.slPrice && p.rules.slPrice < minPrice) minPrice = p.rules.slPrice;
      if (p.rules.tpPrice && p.rules.tpPrice > maxPrice) maxPrice = p.rules.tpPrice;
      if (p.rules.tpPrice && p.rules.tpPrice < minPrice) minPrice = p.rules.tpPrice;
    }
  });

  const range = maxPrice - minPrice || 0.01;
  maxPrice += range * 0.05; minPrice -= range * 0.05;
  const adjustedRange = maxPrice - minPrice;

  // Background grid rulers
  ctx.strokeStyle = "rgba(23, 34, 55, 0.5)"; ctx.lineWidth = 1;
  ctx.font = "10px Courier New"; ctx.fillStyle = "#576880";

  const lines = 5;
  for (let i = 0; i <= lines; i++) {
    const y = paddingTopBottom + (chartHeight * (i / lines));
    const val = maxPrice - (adjustedRange * (i / lines));
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(chartWidth, y); ctx.stroke();
    ctx.fillText(val.toFixed(getPipPrecision(currentPair)), chartWidth + 10, y + 3);
  }

  // Draw Candlestick calculations loops
  const candleSpacing = chartWidth / activeSlicingSubset.length;
  const candleWidth = candleSpacing * 0.72;

  for (let i = 0; i < activeSlicingSubset.length; i++) {
    const candle = activeSlicingSubset[i];
    const isBullish = candle.close >= candle.open;

    const x = (i * candleSpacing) + (candleSpacing - candleWidth) / 2;
    const yOpen = paddingTopBottom + chartHeight * (1 - (candle.open - minPrice) / adjustedRange);
    const yClose = paddingTopBottom + chartHeight * (1 - (candle.close - minPrice) / adjustedRange);
    const yHigh = paddingTopBottom + chartHeight * (1 - (candle.high - minPrice) / adjustedRange);
    const yLow = paddingTopBottom + chartHeight * (1 - (candle.low - minPrice) / adjustedRange);

    const color = isBullish ? "#00b074" : "#ff3b57";
    ctx.strokeStyle = color; ctx.fillStyle = color;

    ctx.beginPath(); ctx.moveTo(x + (candleWidth/2), yHigh); ctx.lineTo(x + (candleWidth/2), yLow); ctx.stroke();
    ctx.fillRect(x, Math.min(yOpen, yClose), candleWidth, Math.max(1, Math.abs(yOpen - yClose)));
  }

  // INTERCEPT LAYER: Render Target Lines (SL / TP / Entry Target levels)
  activePositions.forEach(pos => {
    if (pos.env !== currentEnvironment || pos.pair !== currentPair) return;

    const precision = getPipPrecision(pos.pair);
    const yEntry = paddingTopBottom + chartHeight * (1 - (pos.entryPrice - minPrice) / adjustedRange);
    
    // 1. Plot Entry lines
    ctx.strokeStyle = pos.type === "BUY" ? "#00b074" : "#ff3b57";
    ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(0, yEntry); ctx.lineTo(chartWidth, yEntry); ctx.stroke();

    // 2. Plot Stop Loss Lines if active inside the Spot framework
    if (pos.rules.framework === "SPOT" && pos.rules.slPrice) {
      const ySL = paddingTopBottom + chartHeight * (1 - (pos.rules.slPrice - minPrice) / adjustedRange);
      ctx.strokeStyle = "rgba(255, 59, 87, 0.4)";
      ctx.beginPath(); ctx.moveTo(0, ySL); ctx.lineTo(chartWidth, ySL); ctx.stroke();
      ctx.fillStyle = "rgba(255, 59, 87, 0.15)"; ctx.fillText(`SL #${pos.id}`, 10, ySL - 4);
    }

    // 3. Plot Take Profit Lines if active inside the Spot framework
    if (pos.rules.framework === "SPOT" && pos.rules.tpPrice) {
      const yTP = paddingTopBottom + chartHeight * (1 - (pos.rules.tpPrice - minPrice) / adjustedRange);
      ctx.strokeStyle = "rgba(0, 176, 116, 0.4)";
      ctx.beginPath(); ctx.moveTo(0, yTP); ctx.lineTo(chartWidth, yTP); ctx.stroke();
      ctx.fillStyle = "rgba(0, 176, 116, 0.15)"; ctx.fillText(`TP #${pos.id}`, 10, yTP - 4);
    }
    
    ctx.setLineDash([]); // clear settings
  });
}

// Bind Panning & Zoom Events directly onto our native HTML5 Canvas element
function setupChartInteractionListeners() {
  const wrapper = document.getElementById("chartWrapper");
  if (!wrapper) return;

  // Click & Drag horizontal scrolling initialization tracking logic
  wrapper.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartOffset = currentScrollOffset;
  });

  window.addEventListener("mouseup", () => { isDragging = false; });

  wrapper.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX;
    
    // Scale tracking velocity factors based on current visible elements
    const moveSteps = Math.round(deltaX / (wrapper.clientWidth / visibleCandlesCount));
    
    currentScrollOffset = Math.max(0, Math.min(totalGeneratedCandles - visibleCandlesCount - 5, dragStartOffset + moveSteps));
    renderOwnChart();
  });

  // Scroll wheel Zoom actions binding loop
  wrapper.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      // Zoom out: show more candles
      visibleCandlesCount = Math.min(120, visibleCandlesCount + 2);
    } else {
      // Zoom in: show fewer candles
      visibleCandlesCount = Math.max(15, visibleCandlesCount - 2);
    }
    renderOwnChart();
  });
}

function streamNativeTick() {
  if (mockHistory.length === 0) return;

  const activeNode = mockHistory[mockHistory.length - 1];
  const basePrice = activeNode.close;
  const scale = basePrice > 1000 ? 20.0 : (basePrice > 100 ? 0.08 : 0.0003);
  const drift = (Math.random() - 0.5) * scale;
  const nextPrice = Math.max(0.0001, basePrice + drift);

  activeNode.close = nextPrice;
  if (nextPrice > activeNode.high) activeNode.high = nextPrice;
  if (nextPrice < activeNode.low) activeNode.low = nextPrice;

  prices[currentPair] = nextPrice;
  
  evaluateRiskAutomations(); // Continually track boundary targets on every live pip variation
  updateUI();
  renderPositionsTable();
  renderOwnChart();
}

function changePair() {
  currentPair = document.getElementById("pair").value;
  document.getElementById("activeAssetLabel").innerText = currentPair;
  generateLargeHistoryBuffer();
  updateUI();
  renderPositionsTable();
  renderOwnChart();
}

function updateUI() {
  document.getElementById("balance").innerText = `$${balances[currentEnvironment].toLocaleString(undefined, {minimumFractionDigits: 2})}`;
  document.getElementById("price").innerText = prices[currentPair].toFixed(getPipPrecision(currentPair));
}

/* Auth Modals Infrastructure */
function openAuthModal(view) {
  const container = document.getElementById("modalFormContainer");
  document.getElementById("authModal").classList.remove("hidden");

  if (view === 'login') {
    container.innerHTML = `
      <div class="auth-title"><h2>Exchange Security Gate</h2><p class="subtitle">Enter validation signature keys</p></div>
      <p id="modalError" class="error-msg hidden"></p>
      <form onsubmit="submitAuth(event, 'login')">
        <div class="input-group"><label>Trader Access ID</label><input type="text" id="auth_user" required placeholder="forex_operative"></div>
        <div class="input-group"><label>Security Signature</label><input type="password" id="auth_pass" required placeholder="••••••••"></div>
        <button type="submit" class="btn btn-primary" style="width:100%">Authenticate Core</button>
      </form>
      <p style="margin-top:1.25rem; text-align:center; font-size:0.78rem; color:var(--text-muted)">
        No terminal allocation? <span class="form-link" onclick="openAuthModal('register')">Deploy encryption keys</span>
      </p>`;
  } else {
    container.innerHTML = `
      <div class="auth-title"><h2>Deploy Account Core</h2><p class="subtitle">Establish encrypted profile node keys</p></div>
      <p id="modalError" class="error-msg hidden"></p>
      <form onsubmit="submitAuth(event, 'register')">
        <div class="input-group"><label>Desired Account ID</label><input type="text" id="auth_user" required placeholder="forex_operative"></div>
        <div class="input-group"><label>Passphrase Seed</label><input type="password" id="auth_pass" required placeholder="Min 8 configurations"></div>
        <div class="input-group"><label>Confirm Signature Match</label><input type="password" id="auth_confirm" required placeholder="••••••••"></div>
        <button type="submit" class="btn btn-primary" style="width:100%">Verify Node Parameters</button>
      </form>
      <p style="margin-top:1.25rem; text-align:center; font-size:0.78rem; color:var(--text-muted)">
        Signature registered? <span class="form-link" onclick="openAuthModal('login')">Decrypt profile panel</span>
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
    if (pass.length < 8) { errorEl.innerText = "Error: Key parameters require 8+ indices."; errorEl.classList.remove("hidden"); return; }
    if (pass !== confirmPass) { errorEl.innerText = "Validation Failed: Signatures mismatch."; errorEl.classList.remove("hidden"); return; }
  }

  isAuthenticated = true;
  activeUser = user;
  balances.REAL = 15000.00; 
  closeAuthModal();
  
  document.getElementById("authHeaderActions").innerHTML = `
    <span style="margin-right:12px; color:var(--text-muted); font-size:0.78rem; align-self:center">Node: <strong style="color:var(--warning)">${user}</strong></span>
    <button class="btn btn-secondary btn-sm" onclick="logout()">Disconnect</button>
  `;
  switchEnvironment("REAL");
}

function logout() { window.location.reload(); }

function addHistoryRecord(action, pair, volume, entry, exit, pnl, env, reason) {
  const historyContainer = document.getElementById("history");
  const emptyPlaceholder = historyContainer.querySelector('.ledger-empty');
  if (emptyPlaceholder) emptyPlaceholder.remove();

  const timestamp = new Date().toLocaleTimeString();
  const envClass = env === "REAL" ? "color:var(--warning)" : "color:var(--primary)";
  const actionClass = action === "BUY" ? "color:var(--success)" : "color:var(--danger)";
  const pnlClass = pnl >= 0 ? "color:var(--success)" : "color:var(--danger)";

  const li = document.createElement("li");
  li.innerHTML = `
    <span>[${timestamp}] <strong style="${envClass}">[${env}]</strong> <strong style="${actionClass}">${action}</strong> ${pair} <span style="color:var(--text-muted); font-size:0.7rem;">(${reason})</span></span>
    <span>Entry: ${entry.toFixed(getPipPrecision(pair))} &rarr; Settlement: ${exit.toFixed(getPipPrecision(pair))} | Risk Size: $${volume.toFixed(2)} | <strong style="${pnlClass}">PnL: $${pnl.toFixed(2)}</strong></span>
  `;
  historyContainer.insertBefore(li, historyContainer.firstChild);
}

// Initialization Hooks Execution Loop
document.addEventListener("DOMContentLoaded", () => {
  generateLargeHistoryBuffer();
  setupChartInteractionListeners();
  updateUI();
  
  setTimeout(() => {
    renderOwnChart();
    // High performance tracking intervals running at 1 second loops
    setInterval(streamNativeTick, 1000);
  }, 120);

  window.addEventListener("resize", renderOwnChart);
});
