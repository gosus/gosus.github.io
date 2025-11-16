// ------------------- Glowboard App.js -------------------
let tasksData = [];
let activeTask = null;
let nextTask = null;
let lastActiveTaskName = "";
let dateTimeDisplay = document.getElementById("dateTimeDisplay");
let taskDetailsDiv = document.getElementById("taskDetails");

// SWIPE & LOOPING VARIABLES
let currentDayIndex = 0;
let startX = 0, currentX = 0, isDragging = false;
const swipeContainer = document.getElementById("daySwipeInner");
const leftArrow = document.querySelector(".swipe-arrow.left");
const rightArrow = document.querySelector(".swipe-arrow.right");

// ------------------- Sparkles -------------------
function spawnSparkles(targetElement, count = 5) {
  const rect = targetElement.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    let sparkle = document.createElement("div");
    sparkle.className = "sparkle";
    sparkle.style.left = (rect.left + Math.random() * rect.width) + "px";
    sparkle.style.top = (rect.top + Math.random() * rect.height) + "px";
    document.body.appendChild(sparkle);
    sparkle.addEventListener("animationend", () => sparkle.remove());
  }
}

// ------------------- Notifications -------------------
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

function showNotification(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, { body: body });
  }
}

// ------------------- Load JSON -------------------
fetch("tasks.json")
  .then(res => res.json())
  .then(data => {
    tasksData = data;
    document.getElementById("greeting").textContent = "Welcome, " + data.name + "!";
    initTasks();
  });

// ------------------- Initialize Tasks -------------------
function initTasks() {
  swipeContainer.innerHTML = "";

  tasksData.days.forEach((day, dayIdx) => {
    let panel = document.createElement("div");
    panel.className = "dayPanel";

    let tasksHtml = day.tasks.map((task, i) => `
      <div class="task" data-index="${i}" data-from="${task.from}" data-to="${task.to}" style="--glow-color: rgb(${task.rgb})">
        <div>
          <strong>${task.task}</strong><br/>
          <span class="time">${task.from} - ${task.to}</span>
          <div class="progress-container"><div class="progress-bar"></div></div>
        </div>
      </div>
    `).join("");

    panel.innerHTML = `<h2>${day.day}</h2>${tasksHtml}`;
    swipeContainer.appendChild(panel);

    day.tasks.forEach((t, idx) => {
      t.element = panel.querySelectorAll(".task")[idx];
      t.index = idx;
      t.notifiedStart = false;
      t.notifiedEnd = false;
    });
  });

  // Show today by default
  const todayName = new Date().toLocaleString('en-us', { weekday: 'long' });
  const todayIdx = tasksData.days.findIndex(d => d.day === todayName);
  currentDayIndex = todayIdx >= 0 ? todayIdx : 0;
  slideToCurrentDay();

  setupSwipe();
  setInterval(updateTasks, 1000);
  updateTasks();
}

// ------------------- Swipe / Drag Handlers -------------------
function setupSwipe() {
  swipeContainer.addEventListener("touchstart", startDrag);
  swipeContainer.addEventListener("touchmove", drag);
  swipeContainer.addEventListener("touchend", endDrag);

  swipeContainer.addEventListener("mousedown", startDrag);
  swipeContainer.addEventListener("mousemove", drag);
  swipeContainer.addEventListener("mouseup", endDrag);
  swipeContainer.addEventListener("mouseleave", endDrag);

  leftArrow.addEventListener("click", () => {
    currentDayIndex = (currentDayIndex - 1 + tasksData.days.length) % tasksData.days.length;
    slideToCurrentDay();
  });
  rightArrow.addEventListener("click", () => {
    currentDayIndex = (currentDayIndex + 1) % tasksData.days.length;
    slideToCurrentDay();
  });
}

function startDrag(e) {
  isDragging = true;
  startX = e.touches ? e.touches[0].clientX : e.clientX;
}

function drag(e) {
  if (!isDragging) return;
  currentX = e.touches ? e.touches[0].clientX : e.clientX;
  const dx = currentX - startX;
  swipeContainer.style.transform = `translateX(${-currentDayIndex * window.innerWidth + dx}px)`;
}

function endDrag(e) {
  if (!isDragging) return;
  isDragging = false;
  const dx = currentX - startX;

  if (dx > 80) currentDayIndex = (currentDayIndex - 1 + tasksData.days.length) % tasksData.days.length;
  else if (dx < -80) currentDayIndex = (currentDayIndex + 1) % tasksData.days.length;

  slideToCurrentDay();
}

function slideToCurrentDay() {
  swipeContainer.style.transition = "transform 0.4s ease";
  swipeContainer.style.transform = `translateX(${-currentDayIndex * window.innerWidth}px)`;
  setTimeout(() => swipeContainer.style.transition = "", 400);
  updateTasks();
}

// ------------------- Update Tasks -------------------
function updateTasks() {
  let now = new Date();
  dateTimeDisplay.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
  let todayData = tasksData.days[currentDayIndex];
  if (!todayData) return;

  let newActive = null;

  todayData.tasks.forEach(task => {
    let [fromH, fromM] = task.from.split(":").map(Number);
    let [toH, toM] = task.to.split(":").map(Number);
    let fromTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), fromH, fromM);
    let toTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), toH, toM);

    // Notifications
    if (now >= fromTime && now < fromTime.getTime() + 1000 && !task.notifiedStart) {
      showNotification("Task Started!", `${task.task} has started.`);
      task.notifiedStart = true;
    }
    if (now >= new Date(toTime - 5*60*1000) && now < toTime && !task.notifiedEnd) {
      showNotification("Task Ending Soon", `${task.task} will end in 5 minutes.`);
      task.notifiedEnd = true;
    }

    // Active / past / future classes
    if (now >= fromTime && now < toTime) {
      task.element.classList.add("active");
      task.element.classList.remove("past","future");
      newActive = task;
    } else if (now < fromTime) {
      task.element.classList.remove("active","past");
      task.element.classList.add("future");
    } else {
      task.element.classList.remove("active","future");
      task.element.classList.add("past");
    }

    // Progress bar
    if (task.element.querySelector(".progress-bar") && now >= fromTime && now <= toTime) {
      let pct = ((now - fromTime)/(toTime - fromTime))*100;
      task.element.querySelector(".progress-bar").style.width = pct+"%";
    } else if(task.element.querySelector(".progress-bar")) {
      task.element.querySelector(".progress-bar").style.width = "0%";
    }
  });

  activeTask = newActive;

  // Task details + sparkles + confetti
  if(activeTask){
    if(activeTask.details){
      if(activeTask.details.startsWith("http")){
        taskDetailsDiv.innerHTML = `<a href="${activeTask.details}" target="_blank">Open Task Details</a>`;
      } else {
        taskDetailsDiv.textContent = activeTask.details;
      }
      taskDetailsDiv.classList.add("show");
      const link = taskDetailsDiv.querySelector("a");
      if(link) spawnSparkles(link, 8);
    } else {
      taskDetailsDiv.textContent = "";
      taskDetailsDiv.classList.remove("show");
    }

    if(lastActiveTaskName !== activeTask.task){
      confettiBurst();
      lastActiveTaskName = activeTask.task;
    }

    activeTask.element.scrollIntoView({behavior:"smooth", inline:"center"});
  } else {
    taskDetailsDiv.textContent = "";
    taskDetailsDiv.classList.remove("show");
    lastActiveTaskName = "";
  }
}

// ------------------- Starfield -------------------
let canvas = document.getElementById("starfield");
let ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let stars = [];
for(let i=0;i<150;i++) stars.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, r: Math.random()*1.5});
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

// ------------------- Confetti -------------------
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

// ------------------- Resize Canvas -------------------
window.addEventListener("resize",()=>{
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  confCanvas.width = window.innerWidth;
  confCanvas.height = window.innerHeight;
  swipeContainer.style.transition = "none";
  swipeContainer.style.transform = `translateX(${-currentDayIndex * window.innerWidth}px)`;
});