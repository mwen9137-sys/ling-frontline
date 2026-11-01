const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 簡單的怪獸與跑道模擬
let enemy = { x: 750, y: 180, radius: 20, speed: 1, target: "Cold", hp: 100 };

function drawGame() {
    // 清空畫面
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 畫 3 條平行跑道
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * 100);
        ctx.lineTo(800, i * 100);
        ctx.stroke();
    }

    // 畫我方主城
    ctx.fillStyle = "#00ffcc";
    ctx.fillRect(50, 150, 30, 100);

    // 畫敵方怪獸
    if (enemy.hp > 0) {
        ctx.fillStyle = "#ff0055";
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();

        // 畫怪獸頭頂的語言目標標籤
        ctx.fillStyle = "#fff";
        ctx.font = "14px monospace";
        ctx.fillText(`Target: ${enemy.target}`, enemy.x - 40, enemy.y - 30);
        ctx.fillText(`HP: ${enemy.hp}`, enemy.x - 20, enemy.y + 35);

        // 怪獸向前移動
        enemy.x -= enemy.speed;
        if (enemy.x < 80) {
            alert("主城被突破！ Game Over");
            enemy.x = 750;
            enemy.hp = 100;
        }
    }

    requestAnimationFrame(drawGame);
}

// 瀏覽器內建免費語音辨識 (Web Speech API)
function startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("您的瀏覽器不支援語音辨識，請使用 Chrome！");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();

    document.getElementById("speech-result").innerText = "聆聽中... 請大聲唸出 'Cold'";

    recognition.onresult = function(event) {
        const said = event.results[0][0].transcript.trim();
        document.getElementById("speech-result").innerText = `你唸了: "${said}"`;

        // 判定是否命中目標
        if (said.toLowerCase().includes(enemy.target.toLowerCase())) {
            enemy.hp -= 50;
            document.getElementById("speech-result").innerText += " ➔ 命中克制！造成 50 傷害！";
            if (enemy.hp <= 0) {
                alert("擊殺怪獸！獲得 MP 返還！");
                enemy.x = 750;
                enemy.hp = 100;
            }
        } else {
            document.getElementById("speech-result").innerText += " ➔ 發音不符目標，傷害減半！";
        }
    };
}

// 啟動主循環
drawGame();
window.onload = initGame;
