// Enhanced Glowboard JS
let tasksData = [];
let activeTask = null;
let nextTask = null;
let timeline = document.getElementById("timeline");
let currentInfo = document.getElementById("currentInfo");
let nextUpText = document.getElementById("nextUpText");
let nextUpBar = document.getElementById("nextUp");
let dateTimeDisplay = document.getElementById("dateTimeDisplay");
let musicBtn = document.getElementById("musicToggle");
let bgMusic = document.getElementById("bgMusic");
let isMuted = false;
let lastActiveTaskName = "";

musicBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  bgMusic.muted = isMuted;
  musicBtn.textContent = isMuted ? "🔇 Muted" : "🔊 Mute";
});

fetch("tasks.json")
  .then(res => res.json())
  .then(data => {
    tasksData = data;
    initTasks();
  });

function initTasks() {
  let todayName = new Date().toLocaleString('en-us', {weekday: 'long'});
  let todayData = tasksData.days.find(d => d.day === todayName);
  document.getElementById("dayTitle").textContent = todayName;
  if (!todayData) {
    timeline.innerHTML = "<p>No tasks today!</p>";
    return;
  }

  timeline.innerHTML = "";
  todayData.tasks.forEach((task, i) => {
    let div = document.createElement("div");
    div.className = "task";
    div.style.setProperty("--glow-color", `rgb(${task.rgb})`);
    div.innerHTML = `<div><strong>${task.task}</strong><br/><span class="time">${task.from} - ${task.to}</span>
    <div class="progress-container"><div class="progress-bar"></div></div></div>`;
    timeline.appendChild(div);
    task.element = div;
    task.index = i;
  });

  setInterval(updateTasks, 1000);
  updateTasks();
  bgMusic.play();
}

function updateTasks() {
  let now = new Date();
  dateTimeDisplay.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
  let todayName = now.toLocaleString('en-us', {weekday: 'long'});
  let todayData = tasksData.days.find(d => d.day === todayName);
  if (!todayData) return;

  let anyActive = false;
  let newActive = null;
  let newNext = null;

  todayData.tasks.forEach(task => {
    let [fromH, fromM] = task.from.split(":").map(Number);
    let [toH, toM] = task.to.split(":").map(Number);
    let fromTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), fromH, fromM);
    let toTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), toH, toM);

    if (now >= fromTime && now < toTime) {
      task.element.classList.add("active");
      task.element.classList.remove("past","future");
      newActive = task;
      anyActive = true;
    } else if (now < fromTime) {
      task.element.classList.remove("active","past");
      task.element.classList.add("future");
      if (!newNext) newNext = task;
    } else {
      task.element.classList.remove("active","future");
      task.element.classList.add("past");
    }

    // Update progress bar
    if (task.element.querySelector(".progress-bar") && now >= fromTime && now <= toTime) {
      let pct = ((now - fromTime)/(toTime - fromTime))*100;
      task.element.querySelector(".progress-bar").style.width = pct+"%";
    } else if(task.element.querySelector(".progress-bar")) {
      task.element.querySelector(".progress-bar").style.width = "0%";
    }
  });

  activeTask = newActive;
  nextTask = newNext;

  if(activeTask){
    currentInfo.textContent = `Active: ${activeTask.task} | Ends at ${activeTask.to}`;
    document.body.classList.remove("free-time");

    if(lastActiveTaskName !== activeTask.task){
      playChime("task_chime.mp3");
      confettiBurst();
      lastActiveTaskName = activeTask.task;
    }

    // Scroll active task to center
    activeTask.element.scrollIntoView({behavior:"smooth", inline:"center"});
  } else {
    currentInfo.textContent = "No active task";
    document.body.classList.add("free-time");
    lastActiveTaskName = "";
    playChime("free_chime.mp3");
  }

  if(nextTask){
    nextUpText.textContent = `${nextTask.task} (${nextTask.from})`;
    nextUpBar.classList.add("show");
  } else {
    nextUpBar.classList.remove("show");
  }
}

// Play chime sound
let lastChime = null;
function playChime(file){
  if(lastChime === file) return;
  let audio = new Audio(file);
  audio.volume = 0.5;
  if(!isMuted) audio.play();
  lastChime = file;
}

// --- Starfield ---
let canvas = document.getElementById("starfield");
let ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let stars = [];
for(let i=0;i<150;i++){
  stars.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, r: Math.random()*1.5});
}
function drawStars(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  stars.forEach(s=>{
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctx.fillStyle="white";
    ctx.fill();
  });
  requestAnimationFrame(drawStars);
}
drawStars();

// --- Confetti ---
let confCanvas = document.getElementById("confetti-canvas");
let confCtx = confCanvas.getContext("2d");
confCanvas.width = window.innerWidth;
confCanvas.height = window.innerHeight;
let confetti = [];
function confettiBurst(){
  for(let i=0;i<100;i++){
    confetti.push({
      x:Math.random()*confCanvas.width,
      y:Math.random()*confCanvas.height - confCanvas.height,
      r:Math.random()*6+4,
      d:Math.random()*15+5,
      color:`hsl(${Math.random()*360},100%,60%)`,
      tilt:Math.random()*10-10
    });
  }
  animateConfetti();
}
function animateConfetti(){
  confCtx.clearRect(0,0,confCanvas.width,confCanvas.height);
  confetti.forEach((c,i)=>{
    c.y += Math.sin(c.d/10)+2;
    c.x += Math.sin(c.d/10);
    c.tilt += 0.1;
    confCtx.fillStyle=c.color;
    confCtx.beginPath();
    confCtx.moveTo(c.x+ c.tilt, c.y);
    confCtx.lineTo(c.x+ c.tilt + c.r/2, c.y + c.r);
    confCtx.lineTo(c.x+ c.tilt - c.r/2, c.y + c.r);
    confCtx.closePath();
    confCtx.fill();
    if(c.y>confCanvas.height) confetti.splice(i,1);
  });
  if(confetti.length>0) requestAnimationFrame(animateConfetti);
}

// Resize canvas
window.addEventListener("resize",()=>{
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  confCanvas.width = window.innerWidth;
  confCanvas.height = window.innerHeight;
});