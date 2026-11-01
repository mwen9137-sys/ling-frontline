let castleHP = 1000;
let playerMP = 10;
let currentWave = 1;

// 豐富的詞庫系統
const cardPool = [
    { word: "Table", element: "水 💧", cost: 2 },
    { word: "Hotel", element: "火 🔥", cost: 2 },
    { word: "Key", element: "雷 ⚡", cost: 3 },
    { word: "Clean", element: "木 🌿", cost: 2 },
    { word: "Run", element: "土 ⛰️", cost: 2 },
    { word: "Fast", element: "風 🌪️", cost: 3 }
];

let handCards = [];

function initGame() {
    updateUI();
    generateHand();
    spawnMonster();
    setupVoiceRecognition();
    
    // 每秒自然恢復 1 點 MP
    setInterval(() => {
        if (playerMP < 10) {
            playerMP += 1;
            updateUI();
        }
    }, 1000);
}

function updateUI() {
    document.getElementById("castle-hp").innerText = castleHP;
    document.getElementById("player-mp").innerText = playerMP;
    document.getElementById("current-wave").innerText = currentWave;
}

function generateHand() {
    const cardsGrid = document.getElementById("cards-grid");
    cardsGrid.innerHTML = "";
    handCards = [];

    for (let i = 0; i < 5; i++) {
        const randomCard = cardPool[Math.floor(Math.random() * cardPool.length)];
        handCards.push(randomCard);

        const cardDiv = document.createElement("div");
        cardDiv.className = "card";
        cardDiv.innerHTML = `<span style="font-size: 20px;">${randomCard.element}</span><br><strong style="font-size: 16px; margin-top: 5px;">${randomCard.word}</strong><small style="color: #555;">MP: ${randomCard.cost}</small>`;
        cardDiv.onclick = () => playCard(randomCard);
        cardsGrid.appendChild(cardDiv);
    }
}

function playCard(card) {
    if (playerMP < card.cost) {
        alert("⚡ 能量 MP 不足！請等待恢復或開口唸出單字詠唱！");
        return;
    }
    playerMP -= card.cost;
    updateUI();
    
    const monster = document.querySelector(".monster");
    if (monster) {
        monster.style.transform = "scale(0.5) rotate(20deg)";
        monster.style.opacity = "0";
        setTimeout(() => {
            monster.remove();
            currentWave++;
            updateUI();
            spawnMonster();
        }, 300);
    }
    generateHand();
}

function spawnMonster() {
    const lane = document.getElementById("spawn-lane");
    const monsterDiv = document.createElement("div");
    monsterDiv.className = "monster";
    const targetCard = cardPool[Math.floor(Math.random() * cardPool.length)];
    monsterDiv.innerHTML = `👾 宇宙異獸 (Wave ${currentWave})<br><small style="color: #ffd700;">弱點目標: ${targetCard.word}</small>`;
    lane.appendChild(monsterDiv);
}

function setupVoiceRecognition() {
    const micBtn = document.getElementById("mic-btn");
    const micState = document.getElementById("mic-state");

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        micState.innerText = "❌ 您的瀏覽器不支援語音辨識，請使用 Google Chrome";
        return;
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.continuous = false;

    micBtn.onclick = () => {
        try {
            recognition.start();
            micState.innerText = "🎤 聆聽中... 請對著麥克風大聲唸出英文單字！";
        } catch (e) {
            console.log(e);
        }
    };

    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript.trim();
        micState.innerText = `✨ 語音辨識成功: "${speechResult}" (MP 瞬間充滿並觸發全屏清場！)`;
        playerMP = 10; // 語音詠唱成功直接補滿 MP
        updateUI();

        // 語音成功直接轟炸當前怪獸
        const monster = document.querySelector(".monster");
        if (monster) {
            monster.remove();
            currentWave++;
            updateUI();
            spawnMonster();
        }
        generateHand();
    };

    recognition.onerror = () => {
        micState.innerText = "⚠️ 辨識逾時或未聽清楚，請再試一次！";
    };
}

window.onload = initGame;
}
window.onload = initGame;
