const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = 'START';
let hp = 20;
let gold = 120;
let wave = 1;
let maxWaves = 5;
let selectedSummonType = null;

// 語言題庫
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

class Enemy {
    constructor(waveMultiplier) {
        this.x = 0;
        this.y = 190;
        this.speed = 1.1 + waveMultiplier * 0.15;
        this.maxHealth = 40 + waveMultiplier * 25;
        this.health = this.maxHealth;
        this.radius = 12;
    }
    update() {
        this.x += this.speed;
        if (this.x >= 600) return true;
        return false;
    }
    draw() {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - 14, this.y - 20, 28, 4);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(this.x - 14, this.y - 20, 28 * (this.health / this.maxHealth), 4);
    }
}

class DefenderUnit {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.range = type === 'ranged' ? 130 : (type === 'combo' ? 150 : 85);
        this.damage = type === 'ranged' ? 18 : (type === 'combo' ? 30 : 12);
        this.cooldown = 0;
        this.maxCooldown = type === 'ranged' ? 45 : (type === 'combo' ? 30 : 35);
    }
    update() {
        if (this.cooldown > 0) this.cooldown--;
        let target = null;
        for (let e of enemies) {
            if (Math.hypot(e.x - this.x, e.y - this.y) <= this.range) {
                target = e;
                break;
            }
        }
        if (target && this.cooldown === 0) {
            projectiles.push({ x: this.x, y: this.y, target: target, speed: 6, damage: this.damage });
            this.cooldown = this.maxCooldown;
        }
    }
    draw() {
        let color = '#3b82f6';
        let label = '戰';
        if (this.type === 'ranged') { color = '#a855f7'; label = '法'; }
        if (this.type === 'combo') { color = '#f59e0b'; label = '超'; }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, this.x, this.y + 3);
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
        btn.className = "w-full text-left bg-slate-900 hover:bg-slate-800 text-[11px] p-2 rounded border border-slate-800 transition text-slate-200";
        btn.innerText = `🔹 ${opt}`;
        btn.onclick = () => checkQuizAnswer(idx, quiz.answer);
        optContainer.appendChild(btn);
    });
}

function checkQuizAnswer(selected
