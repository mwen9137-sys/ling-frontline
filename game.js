let castleHP = 1000;
let playerMP = 10;
let currentWave = 1;
let score = 0;
let selectedCardIndex = null;

// 豐富的詞庫與雙元素屬性
const cardPool = [
    { word: "Table", element: "水 💧", type: "water", cost: 2 },
    { word: "Hotel", element: "火 🔥", type: "fire", cost: 2 },
    { word: "Key", element: "雷 ⚡", type: "thunder", cost: 3 },
    { word: "Clean", element: "木 🌿", type: "wood", cost: 2 },
    { word: "Run", element: "土 ⛰️", type: "earth", cost: 2 },
    { word: "Fast", element: "風 🌪️", type: "wind", cost: 3 }
];

// 10 種我方小兵盲盒池
const minionTypes = [
    "重裝持盾兵 🛡️", "狂戰劍士 ⚔️", "長弓手 🏹", "元素法師 🔮", 
    "影武者刺客 🗡️", "飛行鷹隼 🦅", "毒箭獵手 🧪", "火蜥蜴突擊兵 🔥", "樹精長老 🌳", "工程防禦塔 🗼"
];

let handCards = [];
let currentMonster = null;

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
    document.getElementById("score").innerText = score;
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
        if (selectedCardIndex === i) cardDiv.classList.add("selected");
        
        cardDiv.innerHTML = `<span style="font-size: 16px;">${randomCard.element}</span><strong style="font-size: 15px; margin: 4px 0;">${randomCard.word}</strong><small style="color: #666;">MP: ${randomCard.cost}</small>`;
        
        // 點擊卡片進行單張攻擊或 Combo 選擇
        cardDiv.onclick = () => handleCardClick(i);
        cardsGrid.appendChild(cardDiv);
    }
}

function handleCardClick(index) {
    if (selectedCardIndex === null) {
        // 第一次點擊：選中這張卡，或直接發射單張攻擊
        selectedCardIndex = index;
        generateHand();
        
        // 點擊後直接發射單張卡牌攻擊怪獸
        playSingleCard(index);
    } else if (selectedCardIndex === index) {
        // 點擊自己取消選取
        selectedCardIndex = null;
        generateHand();
    } else {
        // 第二次點擊不同卡片：觸發雙卡 Combo 召喚超級小兵！
        triggerCombo(selectedCardIndex, index);
        selectedCardIndex = null;
    }
}

function playSingleCard(index) {
    const card = handCards[index];
    if (playerMP < card.cost) {
        alert("⚡ 能量 MP 不足！");
        selectedCardIndex = null;
        generateHand();
        return;
    }

    playerMP -= card.cost;
    score += 100;
    updateUI();

    // 擊殺當前怪獸
    const monsterEl = document.querySelector(".monster");
    if (monsterEl) {
        monsterEl.style.transform = "scale(0.2) rotate(45deg)";
        monsterEl.style.opacity = "0";
        setTimeout(() => {
            monsterEl.remove();
            currentWave++;
            updateUI();
            spawnMonster();
        }, 300);
    }
    selectedCardIndex = null;
    generateHand();
}

function triggerCombo(index1, index2) {
    const card1 = handCards[index1];
    const card2 = handCards[index2];

    if (playerMP < 4) {
        alert("⚡ MP 不足 4 點，無法發動雙卡 Combo 召喚！");
        return;
    }

    playerMP -= 4;
    score += 300;
    updateUI();

    // 從 10 種兵種隨機抽 1 種盲盒升級為超級泰坦小兵
    const randomMinion = minionTypes[Math.floor(Math.random() * minionTypes.length)];
    
    // 畫面生成小兵
    const lane = document.getElementById("spawn-lane");
    const minionDiv = document.createElement("div");
    minionDiv.className = "minion";
    minionDiv.innerHTML = `🌟 超級泰坦 【${randomMinion}】<br><small>${card1.element} + ${card2.element} 融合！</small>`;
    lane.appendChild(minionDiv);

    // 擊退怪獸
    const monsterEl = document.querySelector(".monster");
    if (monsterEl) {
        monsterEl.remove();
        currentWave++;
        updateUI();
        spawnMonster();
    }

    alert(`🎉 成功觸發 Combo 盲盒召喚：超級泰坦 【${randomMinion}】！`);
    generateHand();
}

function spawnMonster() {
    const lane = document.getElementById("spawn-lane");
    const monsterDiv = document.createElement("div");
    monsterDiv.className = "monster";
    const targetCard = cardPool[Math.floor(Math.random() * cardPool.length)];
    monsterDiv.innerHTML = `👾 宇宙異獸 (Wave ${currentWave})<br><small style="color: #ffd700;">點擊手牌迎擊！</small>`;
    lane.appendChild(monsterDiv);
}

function setupVoiceRecognition() {
    const micBtn = document.getElementById("mic-btn");
    const micState = document.getElementById("mic-state");

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        micState.innerText = "❌ 請使用 Google Chrome 瀏覽器";
        return;
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.continuous = false;

    micBtn.onclick = () => {
        try {
            recognition.start();
            micState.innerText = "🎤 聆聽中... 請大聲說出單字！";
        } catch (e) {
            console.log(e);
        }
    };

    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript.trim();
        micState.innerText = `✨ 語音成功: "${speechResult}" (MP 瞬間補滿並清場！)`;
        playerMP = 10;
        score += 500;
        updateUI();

        const monsterEl = document.querySelector(".monster");
        if (monsterEl) {
            monsterEl.remove();
            currentWave++;
            updateUI();
            spawnMonster();
        }
        generateHand();
    };

    recognition.onerror = () => {
        micState.innerText = "⚠️ 語音未辨識成功，請再試一次！";
    };
}

window.onload = initGame;
