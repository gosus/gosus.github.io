// --- Helper functions ---
const WEEK = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
function timeToMinutes(t){ const [h,m] = t.split(":").map(Number); return h*60+m; }
function getTodayTasks(data){ const today=WEEK[new Date().getDay()]; const dayObj=data.days.find(d=>d.day===today); return dayObj?dayObj.tasks:[]; }

// --- Task emojis ---
const taskEmojis = {
  "Breakfast": "🍳",
  "Snack & Relax": "🍎",
  "Maths Practice": "📚",
  "Physics Revision": "🔬",
  "Dinner Break": "🍲",
  "Music Practice": "🎵",
  "Reading Time": "📖"
};

// --- Greeting ---
function getGreeting(name){
  const hour = new Date().getHours();
  if(hour>=5 && hour<12) return {text:`🌅 Good morning, ${name}!`, night:false};
  if(hour>=12 && hour<18) return {text:`☀️ Good afternoon, ${name}!`, night:false};
  if(hour>=18 && hour<21) return {text:`🌇 Good evening, ${name}!`, night:false};
  return {text:`🌙 Good night, ${name}! Sweet dreams!`, night:true};
}

// --- Starfield ---
let stars=[], starCanvas, ctx, nightMode=false;
function startStars(){
  if(starCanvas) return;
  starCanvas=document.getElementById("starfield"); 
  ctx=starCanvas.getContext("2d");
  resizeCanvas();
  stars=Array.from({length:80},()=>({x:Math.random()*starCanvas.width,y:Math.random()*starCanvas.height,size:Math.random()*2,speed:0.05+Math.random()*0.2,alpha:0.3+Math.random()*0.7}));
  window.addEventListener("resize",resizeCanvas); 
  requestAnimationFrame(animateStars);
}

function stopStars(){ 
  if(!starCanvas) 
    return; 
  ctx.clearRect(0,0,starCanvas.width,starCanvas.height);
}

function resizeCanvas(){
   if(!starCanvas)
     return; 
   starCanvas.width=window.innerWidth; starCanvas.height=window.innerHeight;
}

function animateStars(){
  if(!nightMode||!ctx)return;
    ctx.clearRect(0,0,starCanvas.width,starCanvas.height);
    
  stars.forEach(s=>{s.y+=s.speed;if(s.y>starCanvas.height){s.y=0;s.x=Math.random()*starCanvas.width;} s.alpha+= (Math.random()-0.5)*0.05; s.alpha=Math.max(0.3,Math.min(1,s.alpha)); ctx.beginPath(); ctx.arc(s.x,s.y,s.size,0,2*Math.PI); ctx.fillStyle=`rgba(255,255,255,${s.alpha})`; ctx.fill();});
  requestAnimationFrame(animateStars);
}

// --- Confetti ---
let confettiParticles = [];
const confettiCanvas = document.getElementById("confetti-canvas");
const confettiCtx = confettiCanvas.getContext("2d");

function resizeConfettiCanvas(){
  confettiCanvas.width=window.innerWidth; 
  confettiCanvas.height=window.innerHeight;
}

window.addEventListener("resize",resizeConfettiCanvas); 
resizeConfettiCanvas();

function createConfetti(){
  for(let i=0;i<60;i++){
    confettiParticles.push({x:Math.random()*confettiCanvas.width,y:Math.random()*-confettiCanvas.height,color:`hsl(${Math.random()*360},100%,50%)`,size:Math.random()*6+4,speedY:Math.random()*2+2,speedX:Math.random()*2-1,rotation:Math.random()*360});
  } 
}

function animateConfetti(){
  confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height); 
  confettiParticles.forEach((p,i)=>{ p.y+=p.speedY; p.x+=p.speedX; p.rotation+=5; confettiCtx.fillStyle=p.color; confettiCtx.save(); confettiCtx.translate(p.x,p.y); confettiCtx.rotate(p.rotation*Math.PI/180); confettiCtx.fillRect(-p.size/2,-p.size/2,p.size,p.size); confettiCtx.restore(); if(p.y>confettiCanvas.height) confettiParticles.splice(i,1); }); 
  if(confettiParticles.length>0)
    requestAnimationFrame(animateConfetti);
}

function triggerConfetti(){
  createConfetti(); 
  animateConfetti(); 
}

// --- Render tasks ---
let lastActiveTask = null;
function renderTasks(name,tasks){
  const now=new Date(); 
  const mins=now.getHours()*60+now.getMinutes();
  const timeline=document.getElementById("timeline"); 
  timeline.innerHTML="";
  let active=null;
  tasks.forEach((t,i)=>{
    const from=timeToMinutes(t.from), to=timeToMinutes(t.to);
    let state="future"; 
    if(mins>=to)
      state="past"; 
    else if(mins>=from && mins<to){
      state="active"; 
      active=t; 
    }
    const div=document.createElement("div"); 
    div.className=`task ${state}`; 
    div.style.background=`rgba(${t.rgb},0.25)`; 
    div.style.borderLeft=`8px solid rgb(${t.rgb})`; 
    div.style.animationDelay=`${i*0.1}s`;
    // Emoji
    const icon=document.createElement("span"); 
    icon.className="icon"; 
    icon.textContent=taskEmojis[t.task]||"✅";
    
    const title=document.createElement("div"); 
    title.className="title"; 
    title.textContent=t.task;
    
    const timeDiv=document.createElement("div"); 
    timeDiv.className="time"; 
    timeDiv.textContent=`${t.from} → ${t.to}`;
    
    // Progress bar
    const progressContainer=document.createElement("div"); 
    progressContainer.className="progress-container";
    
    const progressBar=document.createElement("div");
    progressBar.className="progress-bar";
    progressContainer.appendChild(progressBar); t._progressBar=progressBar;
    div.appendChild(icon); 
    div.appendChild(title); 
    div.appendChild(timeDiv); 
    div.appendChild(progressContainer);
    timeline.appendChild(div);
  });
  
  if(lastActiveTask && lastActiveTask!==active && lastActiveTask!==null){
    triggerConfetti(); 
  }
  
  lastActiveTask=active; 
  return active;
}

function updateProgress(activeTask){
  if(!activeTask)
    return; 
  const now=new Date(); 
  const mins=now.getHours()*60+now.getMinutes(); 
  const from=timeToMinutes(activeTask.from); 
  const to=timeToMinutes(activeTask.to); 
  const percent=Math.max(0,Math.min(100,((mins-from)/(to-from))*100)); 
  activeTask._progressBar.style.width=percent+"%";
}

// --- Main render ---
async function loadData(){
  const res=await fetch("tasks.json"); 
  return await res.json();
}

async function renderApp(){
  const data=await loadData(); 
  const tasks=getTodayTasks(data);
  function renderLoop(){
    const active=renderTasks(data.name,tasks); 
    updateProgress(active); 
    const info=document.getElementById("currentInfo"); 
    const mins=new Date().getHours()*60+new Date().getMinutes(); 
    if(active){
      info.textContent=`Now: ${active.task} — ${timeToMinutes(active.to)-mins} min left!`; 
    } else { 
      info.textContent="No active task right now — enjoy your free time!";
    } 
  }
  
  renderLoop(); 
  setInterval(renderLoop,5000);
  
  const {text: greetingText, night}=getGreeting(data.name); 
  nightMode=night; 
  document.getElementById("greeting").textContent=greetingText; 
  nightMode?startStars():stopStars();
  
  const music=document.getElementById("bgMusic");
  const toggle=document.getElementById("musicToggle");
  if(localStorage.getItem("musicPaused")==="true"){
    music.pause(); 
    toggle.textContent="🔇 Unmute"; 
  } else { 
    music.play().catch(()=>{});
  }
   toggle.addEventListener("click",()=>{ if(music.paused){ music.play(); toggle.textContent="🔊 Mute"; localStorage.setItem("musicPaused","false"); } else { music.pause(); toggle.textContent="🔇 Unmute"; localStorage.setItem("musicPaused","true"); } });
}

renderApp();