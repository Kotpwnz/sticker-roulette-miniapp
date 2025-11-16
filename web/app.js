const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const BACKEND_URL = 'http://localhost:8000'; // Замени на свой URL после деплоя (Vercel/Railway)

let roundId = null;
let players = {};
let total = 0;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

document.getElementById('startBtn').addEventListener('click', startRound);
document.getElementById('addBtn').addEventListener('click', addSticker);
document.getElementById('spinBtn').addEventListener('click', spin);

async function startRound() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/new`, { method: 'POST' });
    const data = await res.json();
    roundId = data.round_id;
    document.getElementById('status').innerText = `Раунд: ${roundId}`;
    document.getElementById('addBtn').style.display = 'inline-block';
    document.getElementById('spinBtn').style.display = 'none';
    document.getElementById('players').innerHTML = '';
    document.getElementById('wheel-container').style.display = 'none';
  } catch (err) {
    tg.showAlert('Ошибка создания раунда: ' + err.message);
  }
}

function addSticker() {
  // В реальности: tg.showStickerPicker() или интеграция с NFT-галереей
  // Для демо: симулируем стикер и цену
  const simulatedSticker = { file_id: 'demo_sticker_' + Date.now() };
  const price = Math.random() * 10 + 1; // Заглушка для цены (замени на getStickerPrice)

  sendStickerToBackend(simulatedSticker, price);
}

async function sendStickerToBackend(sticker, price) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        round_id: roundId,
        user_id: tg.initDataUnsafe.user?.id || 12345,
        username: tg.initDataUnsafe.user?.username || 'DemoUser',
        sticker: sticker.file_id,
        price: price
      })
    });
    const data = await res.json();
    updatePlayers(data.players, data.total);
    if (Object.keys(data.players).length >= 2) {
      document.getElementById('spinBtn').style.display = 'inline-block';
    }
  } catch (err) {
    tg.showAlert('Ошибка добавления стикера: ' + err.message);
  }
}

async function getStickerPrice(fileId) {
  // Реальная интеграция с GetGems API (пример)
  try {
    const res = await fetch(`https://api.getgems.io/v1/nft/search?query=${fileId}`);
    const data = await res.json();
    return data.items?.[0]?.sale?.price?.value / 1e9 || Math.random() * 10 + 1;
  } catch {
    return Math.random() * 10 + 1; // Fallback
  }
}

function updatePlayers(p, t) {
  players = p;
  total = t;
  const div = document.getElementById('players');
  div.innerHTML = '<h3>Игроки:</h3>';
  Object.entries(p).forEach(([id, info]) => {
    const percent = (info.weight / t * 100).toFixed(1);
    div.innerHTML += `
      <div class="player">
        <span>@${info.username}</span>
        <span class="chance">${percent}%</span>
        <img class="sticker" src="https://via.placeholder.com/50?text=${info.sticker.slice(-4)}" alt="Sticker">
      </div>
    `;
  });
  drawWheel();
  document.getElementById('wheel-container').style.display = 'block';
}

function drawWheel() {
  const centerX = 140, centerY = 140, radius = 130;
  ctx.clearRect(0, 0, 280, 280);
  let startAngle = 0;
  const colors = ['#e17055', '#f39c12', '#27ae60', '#0984e3', '#9c88ff'];

  Object.entries(players).forEach(([id, info], i) => {
    const angle = (info.weight / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Текст
    const midAngle = startAngle + angle / 2;
    const textX = centerX + Math.cos(midAngle) * (radius / 2);
    const textY = centerY + Math.sin(midAngle) * (radius / 2);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(info.username.slice(0, 6), textX, textY);

    startAngle += angle;
  });
}

async function spin() {
  document.getElementById('spinBtn').disabled = true;
  try {
    const res = await fetch(`${BACKEND_URL}/api/spin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ round_id: roundId })
    });
    const { winner_index } = await res.json();

    // Анимация
    let rotation = 0;
    const spins = 5; // 5 полных оборотов
    const targetRotation = (360 * spins) + (winner_index * (360 / Object.keys(players).length));
    const spinDuration = 4000;
    const startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      // Easing: ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      rotation = ease * targetRotation;
      canvas.style.transform = `rotate(${rotation}deg)`;
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          const winner = Object.values(players)[winner_index];
          tg.showAlert(`🎉 Победитель: @${winner.username}!`);
          startRound(); // Новый раунд
        }, 1000);
      }
    }
    animate();
  } catch (err) {
    tg.showAlert('Ошибка розыгрыша: ' + err.message);
  }
}
