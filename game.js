let castleHP = 1000;
let playerMP = 10;
let currentWave = 1;
const cardPool = [
    { word: "Table", element: "水 💧" },
    { word: "Hotel", element: "火 🔥" },
    { word: "Key", element: "雷 ⚡" },
    { word: "Clean", element: "木 🌿" },
    { word: "Run", element: "土 ⛰️" }
];
function initGame() {
    updateUI();
    generateHand();
    spawnMonster();
    setupVoiceRecognition();
}
function updateUI() {
    document.getElementById("castle-hp").innerText = castleHP;
    document.getElementById("player-mp").innerText = playerMP;
    document.getElementById("current-wave").innerText = currentWave;
}
function generateHand() {
    const cardsGrid = document.getElementById("cards-grid");
    cardsGrid.innerHTML = "";
    for (let i = 0; i < 5; i++) {
        const randomCard = cardPool[Math.floor(Math.random() * cardPool.length)];
        const cardDiv = document.createElement("div");
        cardDiv.className = "card";
        cardDiv.innerHTML = `<span>${randomCard.element}</span><br><strong>${randomCard.word}</strong>`;
        cardDiv.onclick = () => playCard(randomCard);
        cardsGrid.appendChild(cardDiv);
    }
}
function playCard(card) {
    if (playerMP < 2) { alert("MP 不足！"); return; }
    playerMP -= 2;
    updateUI();
    const monster = document.querySelector(".monster");
    if (monster) {
        monster.remove();
        alert(`成功使用卡牌 [${card.word}] 攻擊！`);
        setTimeout(spawnMonster, 1000);
    }
    generateHand();
}
function spawnMonster() {
    const lane = document.getElementById("spawn-lane");
    const monsterDiv = document.createElement("div");
    monsterDiv.className = "monster";
    monsterDiv.innerHTML = "👾 宇宙怪獸<br><small>Target: Key</small>";
    lane.appendChild(monsterDiv);
}
function setupVoiceRecognition() {
    const micBtn = document.getElementById("mic-btn");
    const micState = document.getElementById("mic-state");
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        micState.innerText = "請使用 Chrome 瀏覽器";
        return;
    }
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    micBtn.onclick = () => {
        recognition.start();
        micState.innerText = "🎤 聆聽中... 請說出單字！";
    };
    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript.trim();
        micState.innerText = `✅ 辨識成功: "${speechResult}"`;
        playerMP = Math.min(10, playerMP + 3);
        updateUI();
    };
}
window.onload = initGame;
