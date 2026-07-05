let balance = 10000;
let prices = {
  "EUR/USD": 1.1000,
  "GBP/USD": 1.2500,
  "USD/JPY": 145.00,
  "BTC/USD": 65000
};

let currentPair = "EUR/USD";

function login() {
  let user = document.getElementById("username").value;
  let pass = document.getElementById("password").value;

  if (user && pass) {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("dashboard").classList.remove("hidden");
  } else {
    document.getElementById("loginMsg").innerText = "Enter username and password";
  }
}

function logout() {
  location.reload();
}

function updateUI() {
  document.getElementById("balance").innerText = "$" + balance.toFixed(2);
  document.getElementById("price").innerText = prices[currentPair].toFixed(4);
}

function changePair() {
  currentPair = document.getElementById("pair").value;
  updateUI();
}

function simulatePrices() {
  for (let pair in prices) {
    let change = (Math.random() - 0.5) * 0.01;
    prices[pair] += change;
  }
  updateUI();
}

function buyTrade() {
  let amount = parseFloat(document.getElementById("amount").value);

  if (!amount || amount <= 0) return;

  balance -= amount;

  addHistory("BUY " + currentPair + " $" + amount);
  document.getElementById("tradeMsg").innerText = "BUY executed";
  updateUI();
}

function sellTrade() {
  let amount = parseFloat(document.getElementById("amount").value);

  if (!amount || amount <= 0) return;

  balance += amount;

  addHistory("SELL " + currentPair + " $" + amount);
  document.getElementById("tradeMsg").innerText = "SELL executed";
  updateUI();
}

function addHistory(text) {
  let li = document.createElement("li");
  li.innerText = text;
  document.getElementById("history").appendChild(li);
}

setInterval(simulatePrices, 2000);
updateUI();
