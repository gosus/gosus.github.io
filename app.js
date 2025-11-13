const taskEmojis = {
  "Breakfast": "🍳",
  "Snack & Relax": "🍎",
  "Maths Practice": "📚",
  "Physics Revision": "🔬",
  "Dinner Break": "🍲",
  "Music Practice": "🎵",
  "Reading Time": "📖"
};

// --- Confetti ---
let confettiParticles = [];
const confettiCanvas = document.getElementById("confetti-canvas");
const confettiCtx = confettiCanvas.getContext("2d");

function resizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeConfettiCanvas);
resizeConfettiCanvas();

function createConfetti() {
  for (let i = 0; i < 60; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * -confettiCanvas.height,
      color: `hsl(${Math.random()*360}, 100%, 50%)`,
      size: Math.random() * 6 + 4,
      speedY: Math.random() * 2 + 2,
      speedX: Math.random() * 2 - 1,
      rotation: Math.random() * 360
    });
  }
}

function animateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles.forEach((p, i) => {
    p.y += p.speedY;
    p.x += p.speedX;
    p.rotation += 5;
    confettiCtx.fillStyle = p.color;
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rotation * Math.PI / 180);
    confettiCtx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
    confettiCtx.restore();
    if (p.y > confettiCanvas.height) confettiParticles.splice(i, 1);
  });
  if(confettiParticles.length>0) requestAnimationFrame(animateConfetti);
}

function triggerConfetti() { createConfetti(); animateConfetti(); }

// --- Render tasks with emoji & progress ---
let lastActiveTask = null;
function renderTasks(name, tasks) {
  const now = new Date();
  const mins = now.getHours()*60 + now.getMinutes();
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";

  let active = null;

  tasks.forEach((t,i)=>{
    const from = timeToMinutes(t.from);
    const to = timeToMinutes(t.to);
    let state = "future";
    if(mins>=to) state="past";
    else if(mins>=from && mins<to){ state="active"; active=t; }

    const div = document.createElement("div");
    div.className = `task ${state}`;
    div.style.background = `rgba(${t.rgb},0.25)`;
    div.style.borderLeft = `8px solid rgb(${t.rgb})`;
    div.style.animationDelay = `${i*0.1}s`;

    // Emoji + title
    const icon = document.createElement("span");
    icon.className = "icon";
    icon.textContent = taskEmojis[t.task] || "✅";

    const title = document.createElement("div");
    title.className="title";
    title.textContent = t.task;

    const timeDiv = document.createElement("div");
    timeDiv.className="time";
    timeDiv.textContent = `${t.from} → ${t.to}`;

    // Progress bar
    const progressContainer = document.createElement("div");
    progressContainer.className="progress-container";
    const progressBar = document.createElement("div");
    progressBar.className="progress-bar";
    progressContainer.appendChild(progressBar);

    div.appendChild(icon);
    div.appendChild(title);
    div.appendChild(timeDiv);
    div.appendChild(progressContainer);
    timeline.appendChild(div);

    t._progressBar = progressBar; // save for update
  });

  // Confetti if task changed
  if(lastActiveTask && lastActiveTask!==active && lastActiveTask!==null){
    triggerConfetti();
  }
  lastActiveTask = active;

  return active;
}

// --- Update progress every second ---
function updateProgress(activeTask){
  if(!activeTask) return;
  const now = new Date();
  const mins = now.getHours()*60 + now.getMinutes();
  const from = timeToMinutes(activeTask.from);
  const to = timeToMinutes(activeTask.to);
  const percent = Math.max(0, Math.min(100, ((mins-from)/(to-from))*100));
  activeTask._progressBar.style.width = percent + "%";
}

// --- Integration with main render ---
async function render(name, tasks){
  const active = renderTasks(name, tasks);
  updateProgress(active);
  const info=document.getElementById("currentInfo");
  const mins = new Date().getHours()*60 + new Date().getMinutes();
  if(active){
    const remain = timeToMinutes(active.to)-mins;
    info.textContent = `Now: ${active.task} — ${remain} min left!`;
  } else {
    info.textContent = "No active task right now — enjoy your free time!";
  }
}

// Update progress every second
setInterval(()=>{
  if(lastActiveTask){
    updateProgress(lastActiveTask);
  }
},1000);