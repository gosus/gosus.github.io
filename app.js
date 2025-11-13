const WEEK = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
let stars = [];
let starCanvas, ctx;
let nightMode = false;

async function loadData() {
  const res = await fetch("tasks.json");
  return await res.json();
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function getTodayTasks(data) {
  const today = WEEK[new Date().getDay()];
  const dayObj = data.days.find(d => d.day === today);
  return dayObj ? dayObj.tasks : [];
}

function getGreeting(name) {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12)
    return { text: `Good morning, ${name}! 🌞`, bg: "linear-gradient(180deg,#ffecd2,#fcb69f)", night: false };
  if (hour >= 12 && hour < 18)
    return { text: `Good afternoon, ${name}! 🌤️`, bg: "linear-gradient(180deg,#89f7fe,#66a6ff)", night: false };
  if (hour >= 18 && hour < 21)
    return { text: `Good evening, ${name}! 🌇`, bg: "linear-gradient(180deg,#fbc2eb,#a6c1ee)", night: false };
  return { text: `Good night, ${name}! 🌙`, bg: "linear-gradient(180deg,#141E30,#243B55)", night: true };
}

function render(name, tasks) {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const today = WEEK[now.getDay()];

  const { text: greetingText, bg: baseBg, night } = getGreeting(name);
  document.body.style.background = baseBg;
  nightMode = night;

  if (nightMode) startStars(); else stopStars();

  document.getElementById("greeting").textContent = greetingText;
  document.getElementById("dayTitle").textContent = `${today}'s Plan`;

  const timeline = document.getElementById("timeline");
  const info = document.getElementById("currentInfo");
  timeline.innerHTML = "";

  let active = null;

  tasks.forEach((t, i) => {
    const from = timeToMinutes(t.from);
    const to = timeToMinutes(t.to);
    let state = "future";
    if (mins >= to) state = "past";
    else if (mins >= from && mins < to) {
      state = "active";
      active = t;
    }

    const div = document.createElement("div");
    div.className = `task ${state}`;
    div.style.background = `rgba(${t.rgb}, 0.25)`;
    div.style.borderLeft = `8px solid rgb(${t.rgb})`;
    div.style.animationDelay = `${i * 0.1}s`;
    div.innerHTML = `<div class="title">${t.task}</div><div class="time">${t.from} → ${t.to}</div>`;
    timeline.appendChild(div);
  });

  if (active) {
    const remain = timeToMinutes(active.to) - mins;
    info.textContent = `Now: ${active.task} — ${remain} min left!`;
    document.body.style.background = `linear-gradient(180deg, rgba(${active.rgb},0.35), #1a1c2f)`;
  } else {
    info.textContent = "No active task right now — enjoy your free time!";
  }
}

// --- Starfield Animation ---
function startStars() {
  if (starCanvas) return;
  starCanvas = document.getElementById("starfield");
  ctx = starCanvas.getContext("2d");
  resizeCanvas();

  stars = Array.from({ length: 80 }, () => ({
    x: Math.random() * starCanvas.width,
    y: Math.random() * starCanvas.height,
    size: Math.random() * 2,
    speed: 0.05 + Math.random() * 0.2,
    alpha: 0.3 + Math.random() * 0.7
  }));

  window.addEventListener("resize", resizeCanvas);
  requestAnimationFrame(animateStars);
}

function stopStars() {
  if (!starCanvas) return;
  const ctx = starCanvas.getContext("2d");
  ctx.clearRect(0, 0, starCanvas.width, starCanvas.height);
}

function resizeCanvas() {
  if (!starCanvas) return;
  starCanvas.width = window.innerWidth;
  starCanvas.height = window.innerHeight;
}

function animateStars() {
  if (!nightMode || !ctx) return;
  ctx.clearRect(0, 0, starCanvas.width, starCanvas.height);

  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > starCanvas.height) {
      star.y = 0;
      star.x = Math.random() * starCanvas.width;
    }
    star.alpha += (Math.random() - 0.5) * 0.05;
    star.alpha = Math.max(0.3, Math.min(1, star.alpha));

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
    ctx.fill();
  });

  requestAnimationFrame(animateStars);
}

async function init() {
  const data = await loadData();
  const tasks = getTodayTasks(data);
  render(data.name, tasks);
  setInterval(() => render(data.name, tasks), 60000);

  // Background Music
  const music = document.getElementById("bgMusic");
  const toggleBtn = document.getElementById("musicToggle");
  music.volume = 0.2;
  music.play().catch(() => {});
  toggleBtn.addEventListener("click", () => {
    if (music.paused) { music.play(); toggleBtn.textContent = "🔊 Mute"; }
    else { music.pause(); toggleBtn.textContent = "🔇 Unmute"; }
  });
}

init();