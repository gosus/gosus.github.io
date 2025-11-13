const WEEK = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
let stars = [], starCanvas, ctx, nightMode = false;

// --- Load JSON ---
async function loadData() {
  const res = await fetch("tasks.json");
  return await res.json();
}

// --- Time helpers ---
function timeToMinutes(t){ const [h,m] = t.split(":").map(Number); return h*60+m; }
function getTodayTasks(data){ const today=WEEK[new Date().getDay()]; const dayObj=data.days.find(d=>d.day===today); return dayObj?dayObj.tasks:[]; }

// --- Greeting with icons ---
function getGreeting(name){
  const hour = new Date().getHours();
  if(hour>=5 && hour<12) return {text:`🌅 Good morning, ${name}!`, bg:"linear-gradient(180deg,#ffecd2,#fcb69f)", night:false};
  if(hour>=12 && hour<18) return {text:`☀️ Good afternoon, ${name}!`, bg:"linear-gradient(180deg,#89f7fe,#66a6ff)", night:false};
  if(hour>=18 && hour<21) return {text:`🌇 Good evening, ${name}!`, bg:"linear-gradient(180deg,#fbc2eb,#a6c1ee)", night:false};
  return {text:`🌙 Good night, ${name}! Sweet dreams!`, bg:"linear-gradient(180deg,#141E30,#243B55)", night:true};
}

// --- Render tasks ---
function render(name,tasks){
  const now=new Date(); const mins=now.getHours()*60+now.getMinutes();
  const {text:bgText,bg,night} = getGreeting(name); nightMode=night;

  document.getElementById("greeting").textContent = bgText;
  document.getElementById("dayTitle").textContent = `${WEEK[now.getDay()]}'s Plan`;
  document.body.style.background = bg;

  nightMode?startStars():stopStars();

  const timeline=document.getElementById("timeline");
  const info=document.getElementById("currentInfo");
  const loading=document.getElementById("loading");
  timeline.innerHTML=""; loading.style.display="none";

  if(tasks.length===0){ info.textContent="No scheduled tasks today — enjoy your free time!"; return; }

  let active=null;
  tasks.forEach((t,i)=>{
    const from=timeToMinutes(t.from), to=timeToMinutes(t.to);
    let state="future"; if(mins>=to) state="past"; else if(mins>=from && mins<to){state="active"; active=t;}
    const div=document.createElement("div");
    div.className=`task ${state}`;
    div.style.background=`rgba(${t.rgb},0.25)`; div.style.borderLeft=`8px solid rgb(${t.rgb})`;
    div.style.animationDelay=`${i*0.1}s`;
    div.innerHTML=`<div class="title">${t.task}</div><div class="time">${t.from} → ${t.to}</div>`;
    timeline.appendChild(div);
  });

  if(active){ const remain=timeToMinutes(active.to)-mins; info.textContent=`Now: ${active.task} — ${remain} min left!`;
    document.body.style.background=`linear-gradient(180deg, rgba(${active.rgb},0.35), #1a1c2f)`;}
}

// --- Starfield ---
function startStars(){
  if(starCanvas) return;
  starCanvas=document.getElementById("starfield"); ctx=starCanvas.getContext("2d");
  resizeCanvas();
  stars=Array.from({length:80},()=>({x:Math.random()*starCanvas.width,y:Math.random()*starCanvas.height,size:Math.random()*2,speed:0.05+Math.random()*0.2,alpha:0.3+Math.random()*0.7}));
  window.addEventListener("resize",resizeCanvas); requestAnimationFrame(animateStars);
}
function stopStars(){ if(!starCanvas) return; ctx.clearRect(0,0,starCanvas.width,starCanvas.height);}
function resizeCanvas(){ if(!starCanvas) return; starCanvas.width=window.innerWidth; starCanvas.height=window.innerHeight;}
function animateStars(){ if(!nightMode||!ctx)return; ctx.clearRect(0,0,starCanvas.width,starCanvas.height);
  stars.forEach(s=>{s.y+=s.speed;if(s.y>starCanvas.height){s.y=0;s.x=Math.random()*starCanvas.width;} s.alpha+= (Math.random()-0.5)*0.05; s.alpha=Math.max(0.3,Math.min(1,s.alpha)); ctx.beginPath(); ctx.arc(s.x,s.y,s.size,0,2*Math.PI); ctx.fillStyle=`rgba(255,255,255,${s.alpha})`; ctx.fill();});
  requestAnimationFrame(animateStars);
}

// --- Init ---
async function init(){
  const data=await loadData();
  const tasks=getTodayTasks(data);
  render(data.name,tasks);
  setInterval(()=>render(data.name,tasks),60000);

  const music=document.getElementById("bgMusic");
  const toggle=document.getElementById("musicToggle");

  // Load stored preference
  if(localStorage.getItem("musicPaused")==="true"){ music.pause(); toggle.textContent="🔇 Unmute"; } else { music.play().catch(()=>{}); }

  toggle.addEventListener("click",()=>{
    if(music.paused){ music.play(); toggle.textContent="🔊 Mute"; localStorage.setItem("musicPaused","false"); }
    else{ music.pause(); toggle.textContent="🔇 Unmute"; localStorage.setItem("musicPaused","true"); }
  });
}

init();
