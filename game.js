const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = 'START';
let hp = 20;
let gold = 120;
let wave = 1;
let maxWaves = 5;
let selectedSummonType = null;
let animationFrameCount = 0; // 用於計算動態動畫循環

// 豐富的語言題庫（核心學習驅動）
const quizList = [
    { q: "請選出英文「Trade-off (代價平衡)」的正確含意：", options: ["有得必有失的取捨", "無條件的贈送", "絕對的勝利", "完全的放棄"], answer: 0 },
    { q: "法語「C'est la vie」的意思是？", options: ["這就是人生", "早安", "謝謝", "再見"], answer: 0 },
    { q: "日語「一期一會」強調的是？", options: ["珍視當下的相遇", "永恆不變", "無限循環", "戰鬥勝利"], answer: 0 },
    { q: "英文「Strategic (戰略性的)」的反義詞較接近？", options: ["隨機盲目的", "深思熟慮的", "精準的", "計畫性的"], answer: 0 },
    { q: "西班牙語「Amigo」中文是？", options: ["朋友", "敵人", "陌生人", "戰士"], answer: 0 }
];
let currentQuizIndex = 0;

const path = [{x: 0, y: 190}, {x: 120, y: 190}, {x: 240, y: 190}, {x: 360, y: 190}, {x: 480, y: 190}, {x: 600, y: 190}];
const defenseSlots = [
    {x: 100, y: 120, occupied: false},
    {x: 200, y: 260, occupied: false},
    {x: 300, y: 120, occupied: false},
    {x: 400, y: 260, occupied: false},
    {x: 500, y: 120, occupied: false}
];

let units = [];
let enemies = [];
let projectiles = [];
let particles = []; // 粒子特效陣列（讓打擊感大增）

// 帶有動畫效果的怪獸類別
class Enemy {
    constructor(waveMultiplier) {
        this.x = 0;
        this.y = 190;
        this.speed = 1.0 + waveMultiplier * 0.15;
        this.maxHealth = 40 + waveMultiplier * 25;
        this.health = this.maxHealth;
        this.radius = 14;
        this.walkCycle = Math.random() * 100; // 獨立的走路動畫步態
    }
    update() {
        this.x += this.speed;
        this.walkCycle += 0.15; // 累加速度驅動上下起伏動畫
        if (this.x >= 600) return true;
        return false;
    }
    draw() {
        ctx.save();
        // 模擬走路時上下彈跳的動態感
        let bounce = Math.sin(this.walkCycle) * 4;
        
        // 怪獸本體外觀
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(this.x, this.y + bounce, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 動態眼睛（盯著前方）
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(this.x + 4, this.y + bounce - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        // 血條
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - 16, this.y + bounce - 24, 32, 5);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(this.x - 16, this.y + bounce - 24, 32 * (this.health / this.maxHealth), 5);
        
        ctx.restore();
    }
}

// 帶有動態攻擊與呼吸特效的防禦單位類別
class DefenderUnit {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.range = type === 'ranged' ? 130 : (type === 'combo' ? 150 : 85);
        this.damage = type === 'ranged' ? 18 : (type === 'combo' ? 32 : 12);
        this.cooldown = 0;
        this.maxCooldown = type === 'ranged' ? 45 : (type === 'combo' ? 28 : 35);
        this.attackAnimTimer = 0; // 攻擊時的後座力動畫計時器
    }
    update() {
        if (this.cooldown > 0) this.cooldown--;
        if (this.attackAnimTimer > 0) this.attackAnimTimer--;

        let target = null;
        for (let e of enemies) {
            if (Math.hypot(e.x - this.x, e.y - this.y) <= this.range) {
                target = e;
                break;
            }
        }
        if (target && this.cooldown === 0) {
            projectiles.push({ x: this.x, y: this.y, target: target, speed: 7, damage: this.damage, type: this.type });
            this.cooldown = this.maxCooldown;
            this.attackAnimTimer = 12; // 觸發攻擊微調動畫
        }
    }
    draw() {
        ctx.save();
        let color = '#3b82f6';
        let label = '戰';
        if (this.type === 'ranged') { color = '#a855f7'; label = '法'; }
        if (this.type === 'combo') { color = '#f59e0b'; label = '超'; }

        // 呼吸燈效果（微小的縮放動畫）
        let pulse = Math.sin(animationFrameCount * 0.08) * 2;
        let recoil = this.attackAnimTimer > 0 ? 3 : 0; // 攻擊時產生的後座力位移

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y - recoil, 16 + pulse * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, this.x, this.y - recoil + 4);
        ctx.restore();
    }
}

// 產生華麗的爆炸與擊打粒子特效
function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            alpha: 1.0,
            color: color,
            radius: Math.random() * 3 + 1
        });
    }
}

function loadQuiz() {
    if (currentQuizIndex >= quizList.length) currentQuizIndex = 0;
    let quiz = quizList[currentQuizIndex];
    document.getElementById('quiz-question').innerText = `Q: ${quiz.q}`;
    let optContainer = document.getElementById('quiz-options');
    optContainer.innerHTML = '';
    quiz.options.forEach((opt, idx) => {
        let btn = document.createElement('button');
        btn.className = "w-full text-left bg-slate-900 hover:bg-slate-800 text-[11px] p-2 rounded border border-slate-800 transition text-slate-200 cursor-pointer";
        btn.innerText = `🔹 ${opt}`;
        btn.onclick = () => checkQuizAnswer(idx, quiz.answer);
        optContainer.appendChild(btn);
    });
}

function checkQuizAnswer(selected, correct) {
    let feedback = document.getElementById('quiz-feedback');
    if (selected === correct) {
        feedback.className = "text-[11px] mt-2 font-bold text-center text-green-400";
        feedback.innerText = "🎉 答對！獲得 +60 語靈金幣！";
        gold += 60;
        updateUI();
        currentQuizIndex++;
        setTimeout(() => { feedback.innerText = ""; loadQuiz(); }, 1200);
    } else {
        feedback.className = "text-[11px] mt-2 font-bold text-center text-red-400";
        feedback.innerText = "❌ 答錯了，請重新思考！";
    }
}

function summonUnit(type) {
    selectedSummonType = type;
    alert(`已選定【${type === 'melee' ? '近戰語靈騎士' : '遠程元素法師'}】，請點擊戰場上的空位部署！`);
}

canvas.addEventListener('click', (e) => {
    if (gameState !== 'PLAYING' || !selectedSummonType) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (let slot of defenseSlots) {
        if (!slot.occupied && Math.hypot(slot.x - mouseX, slot.y - mouseY) < 22) {
            let cost = selectedSummonType === 'ranged' ? 75 : 50;
            if (gold >= cost) {
                gold -= cost;
                units.push(new DefenderUnit(slot.x, slot.y, selectedSummonType));
                slot.occupied = true;
                selectedSummonType = null;
                updateUI();
            } else {
                alert('金幣不足！請先去右側回答語言練習題賺取金幣！');
            }
            break;
        }
    }
});

// 代價平衡：雙牌 Combo 隨機超級召喚
function triggerComboSummon() {
    if (gold < 100) {
        alert('金幣不足 100G，無法發動雙牌 Combo 召喚！');
        return;
    }
    gold -= 100;
    let emptySlots = defenseSlots.filter(s => !s.occupied);
    if (emptySlots.length === 0) {
        alert('戰場已無空位可部署！');
        gold += 100;
        return;
    }
    let slot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
    slot.occupied = true;
    units.push(new DefenderUnit(slot.x, slot.y, 'combo'));
    updateUI();
    alert('🎲 雙牌 Combo 成功！雖然數值暴增，但隨機抽出了超級語靈戰士/法師！');
}

function updateUI() {
    document.getElementById('hp-display').innerText = hp;
    document.getElementById('gold-display').innerText = gold;
    document.getElementById('wave-display').innerText = `${wave} / ${maxWaves}`;
}

// 動態遊戲主迴圈（每秒 60 次流暢動畫演算）
function gameLoop() {
    animationFrameCount++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製戰場背景與捲軸路徑
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 32;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let p of path) ctx.lineTo(p.x, p.y);
    ctx.stroke();

    // 繪製陣地格子
    for (let slot of defenseSlots) {
        ctx.fillStyle = slot.occupied ? '#1e293b' : '#334155';
        ctx.beginPath();
        ctx.arc(slot.x, slot.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.stroke();
    }

    // 更新與繪製敵人動畫
    for (let i = enemies.length - 1; i >= 0; i--) {
        let breakthrough = enemies[i].update();
        if (breakthrough) {
            enemies.splice(i, 1);
            hp--;
            updateUI();
            if (hp <= 0) endGame(false);
        } else {
            enemies[i].draw();
        }
    }

    // 更新與繪製防禦單位動畫
    for (let u of units) {
        u.update();
        u.draw();
    }

    // 更新與繪製攻擊彈道
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        let dx = p.target.x - p.x;
        let dy = p.target.y - p.y;
        let dist = Math.hypot(dx, dy);
        if (dist < p.speed || !enemies.includes(p.target)) {
            if (enemies.includes(p.target)) {
                p.target.health -= p.damage;
                createParticles(p.target.x, p.target.y, p.type === 'ranged' ? '#c084fc' : '#60a5fa');
                if (p.target.health <= 0) {
                    let idx = enemies.indexOf(p.target);
                    if (idx > -1) {
                        enemies.splice(idx, 1);
                        gold += 25;
                        updateUI();
                    }
                }
            }
            projectiles.splice(i, 1);
        } else {
            p.x += (dx / dist) * p.speed;
            p.y += (dy / dist) * p.speed;
            ctx.fillStyle = p.type === 'ranged' ? '#c084fc' : '#fbbf24';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 更新與繪製打擊特效粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        let pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.04;
        if (pt.alpha <= 0) {
            particles.splice(i, 1);
        } else {
            ctx.save();
            ctx.globalAlpha = pt.alpha;
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    if (gameState === 'PLAYING' && enemies.length === 0) {
        if (wave < maxWaves) {
            wave++;
            gold += 50;
            updateUI();
            startWave();
        } else {
            endGame(true);
        }
    }

    if (gameState === 'PLAYING') {
        requestAnimationFrame(gameLoop);
    }
}

function startWave() {
    let count = 3 + wave * 2;
    let spawned = 0;
    let interval = setInterval(() => {
        if (spawned < count && gameState === 'PLAYING') {
            enemies.push(new Enemy(wave));
            spawned++;
        } else {
            clearInterval(interval);
        }
    }, 1200);
}

document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('overlay-screen').classList.add('hidden');
    gameState = 'PLAYING';
    hp = 20;
    gold = 120;
    wave = 1;
    units = [];
    enemies = [];
    projectiles = [];
    particles = [];
    defenseSlots.forEach(s => s.occupied = false);
    updateUI();
    loadQuiz();
    startWave();
    gameLoop();
});

function endGame(isWin) {
    gameState = isWin ? 'WIN' : 'GAMEOVER';
    const overlay = document.getElementById('overlay-screen');
    document.getElementById('overlay-title').innerText = isWin ? "🎉 挑戰成功！語靈防線完美守住！" : "💀 防線崩潰...";
    document.getElementById('overlay-desc').innerText = isWin ? "你成功結合了外語練習與代價平衡策略，擊退了所有怪獸！" : "怪獸突破了橫向捲軸防線。多答對幾題語言題目來累積金幣與強力 Combo 吧！";
    document.getElementById('start-btn').innerText = "重新挑戰";
    overlay.classList.remove('hidden');
}
