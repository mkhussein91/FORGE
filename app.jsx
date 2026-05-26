const { useState } = React;

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#060810;--surface:#0d1017;--card:#111520;--border:#1e2535;
    --accent:#00e5a0;--accent2:#ff4d6d;--accent3:#7b61ff;--gold:#f5c542;
    --blue:#5cc8ff;--text:#e8eaf0;--muted:#5a6380;
    --fd:'Bebas Neue',sans-serif;--fb:'Syne',sans-serif;--fm:'DM Mono',monospace;
  }
  body{background:var(--bg);color:var(--text);font-family:var(--fb);}
  button{cursor:pointer}
  ::-webkit-scrollbar{width:3px}
  ::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .fade{animation:fadeUp 0.3s ease forwards}
  input,textarea{font-family:var(--fm)}
`;

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const DEMO = {
  oura:{readiness:82,hrv:67,restingHR:52,sleepScore:78,deepSleep:1.4,remSleep:1.8,totalSleep:7.2,bodyTemp:0.1,spo2:97},
  whoop:{strain:12.4,recovery:74,hrv:65,calories:2840,activeCalories:620,avgHR:71,skinTemp:35.2},
  calai:{protein:142,carbs:280,fat:68,calories:2320,fiber:28,water:2.4,meals:4},
  history:DAYS.map((day,i)=>({
    day,
    hrv:      [52,58,67,61,71,63,67][i],
    recovery: [55,62,74,68,80,70,74][i],
    readiness:[60,68,82,75,85,78,82][i],
    sleep:    [6.1,6.8,7.2,6.5,7.8,8.1,7.2][i],
    strain:   [8.2,10.1,12.4,9.8,14.2,7.1,12.4][i],
    protein:  [118,135,142,128,155,140,142][i],
    calories: [2100,2350,2320,2180,2680,2420,2320][i],
    deep:     [0.9,1.1,1.4,1.0,1.6,1.7,1.4][i],
    rem:      [1.2,1.5,1.8,1.4,2.0,1.9,1.8][i],
    restHR:   [56,54,52,55,50,51,52][i],
    spo2:     [96,97,97,96,98,97,97][i],
  }))
};

const INSIGHTS = {
  verdict:"TRAIN HARD", verdictColor:"#00e5a0",
  insight:"HRV is up 6ms from yesterday and WHOOP recovery sits at 74% — your CNS is primed for a heavy session. Deep sleep was solid at 1.4h, meaning muscular repair overnight was optimal. Hit the big compounds hard today.",
  workout:{
    focus:"Pull — Back & Biceps", duration:"65–75 min", intensity:"High",
    warmup:"5 min row + band pull-aparts ×20",
    exercises:[
      {name:"Barbell Deadlift",     sets:4,reps:"4–6",  rest:"3 min",  note:"RPE 9 — top set then -10%"},
      {name:"Weighted Pull-Ups",    sets:4,reps:"6–8",  rest:"2.5 min",note:"Add 10–15 lbs"},
      {name:"Pendlay Row",          sets:3,reps:"6–8",  rest:"2 min",  note:"Explosive concentric"},
      {name:"Cable Row (wide)",     sets:3,reps:"10–12",rest:"90s",    note:"Full stretch at bottom"},
      {name:"Face Pulls",           sets:3,reps:"15–20",rest:"60s",    note:"Rear delt focus"},
      {name:"Incline DB Curl",      sets:3,reps:"10–12",rest:"75s",    note:"Supinate at top"},
      {name:"Hammer Curl",          sets:2,reps:"12–15",rest:"60s",    note:"Brachialis overload"},
    ],
    cooldown:"Dead hang 3×30s, doorway stretch, foam roll thoracic"
  },
  nutrition:{
    targetCalories:3050,targetProtein:185,targetCarbs:340,targetFat:88,
    tips:[
      "You're 43g short on protein — add a shake or Greek yogurt with lunch",
      "Pre-workout: 60g oats + 1 banana 90 min before training",
      "Post-workout: 50g whey + 80g white rice within 30 min",
      "Hydration: push to 3L today — you hit 2.4L yesterday"
    ]
  },
  recovery:[
    "Sleep by 10:30 PM — you need 7.5h+ to sustain this training block",
    "10 min contrast shower post-workout (90s cold / 90s hot × 3)",
    "Foam roll quads and lats tonight — strain building all week",
    "No alcohol tonight — blunts protein synthesis from today's session"
  ]
};

// ── Chart primitives ──────────────────────────────────────────────────────────
function LineChart({data,valueKey,color,unit="",h=90,showDots=true}){
  const vals=data.map(d=>d[valueKey]);
  const lo=Math.min(...vals),hi=Math.max(...vals),rng=hi-lo||1;
  const W=100,H=h;
  const px=i=>(i/(vals.length-1))*(W-12)+6;
  const py=v=>(H-20)-((v-lo)/rng)*(H-32);
  const pts=vals.map((v,i)=>`${px(i)},${py(v)}`).join(" ");
  const area=`M6,${H-20} `+vals.map((v,i)=>`L${px(i)},${py(v)}`).join(" ")+` L${px(vals.length-1)},${H-20} Z`;
  const last=vals[vals.length-1],prev=vals[vals.length-2];
  const id=`g${valueKey}${color.replace(/[^a-z0-9]/gi,"")}`;
  return(
    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
        <span style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:1}}>{valueKey.replace(/_/g," ")}</span>
        <span style={{fontFamily:"var(--fm)",fontSize:10,color:last>=prev?"var(--accent)":"var(--accent2)"}}>{last>=prev?"▲":"▼"} vs prev</span>
      </div>
      <div style={{fontFamily:"var(--fd)",fontSize:24,color,letterSpacing:1,marginBottom:6}}>{last}{unit}</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:h,display:"block",overflow:"visible"}}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id})`}/>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {showDots&&vals.map((v,i)=>(
          <circle key={i} cx={px(i)} cy={py(v)} r={i===vals.length-1?3.5:2} fill={color}/>
        ))}
        {data.map((d,i)=>(
          <text key={i} x={px(i)} y={H-3} textAnchor="middle" fill="var(--muted)" fontSize="7" fontFamily="var(--fm)">{d.day}</text>
        ))}
      </svg>
    </div>
  );
}

function BarChart({data,valueKey,color,target,unit="",h=80}){
  const vals=data.map(d=>d[valueKey]);
  const maxV=Math.max(...vals,target||0)*1.12;
  const last=vals[vals.length-1];
  return(
    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
        <span style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:1}}>{valueKey}</span>
        {target&&<span style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)"}}>goal {target}{unit}</span>}
      </div>
      <div style={{fontFamily:"var(--fd)",fontSize:24,color,letterSpacing:1,marginBottom:8}}>{last}{unit}</div>
      <div style={{display:"flex",alignItems:"flex-end",gap:3,height:h}}>
        {data.map((d,i)=>{
          const v=d[valueKey],pct=(v/maxV)*100,today=i===data.length-1;
          const hit=target?v>=target*0.85:true;
          return(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{width:"100%",height:`${pct}%`,minHeight:3,borderRadius:"3px 3px 0 0",
                background:today?color:hit?color+"55":"var(--accent2)44",
                transition:"height 0.5s ease",position:"relative"}}>
                {today&&<span style={{position:"absolute",top:-16,left:"50%",transform:"translateX(-50%)",
                  fontFamily:"var(--fm)",fontSize:8,color,whiteSpace:"nowrap"}}>{v}</span>}
              </div>
              <span style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--muted)"}}>{d.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DualLineChart({data,keyA,keyB,colorA,colorB,labelA,labelB,unit="",h=100}){
  const valsA=data.map(d=>d[keyA]),valsB=data.map(d=>d[keyB]);
  const allVals=[...valsA,...valsB];
  const lo=Math.min(...allVals),hi=Math.max(...allVals),rng=hi-lo||1;
  const W=100,H=h;
  const px=i=>(i/(data.length-1))*(W-12)+6;
  const py=v=>(H-20)-((v-lo)/rng)*(H-32);
  const ptsA=valsA.map((v,i)=>`${px(i)},${py(v)}`).join(" ");
  const ptsB=valsB.map((v,i)=>`${px(i)},${py(v)}`).join(" ");
  return(
    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 14px"}}>
      <div style={{display:"flex",gap:14,marginBottom:6}}>
        <span style={{fontFamily:"var(--fm)",fontSize:10,color:colorA}}>● {labelA}: <b style={{fontFamily:"var(--fd)",fontSize:14}}>{valsA[valsA.length-1]}{unit}</b></span>
        <span style={{fontFamily:"var(--fm)",fontSize:10,color:colorB}}>● {labelB}: <b style={{fontFamily:"var(--fd)",fontSize:14}}>{valsB[valsB.length-1]}{unit}</b></span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:h,display:"block",overflow:"visible"}}>
        <polyline points={ptsA} fill="none" stroke={colorA} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points={ptsB} fill="none" stroke={colorB} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3,2"/>
        {valsA.map((v,i)=><circle key={i} cx={px(i)} cy={py(v)} r={i===valsA.length-1?3:1.5} fill={colorA}/>)}
        {valsB.map((v,i)=><circle key={i} cx={px(i)} cy={py(v)} r={i===valsB.length-1?3:1.5} fill={colorB}/>)}
        {data.map((d,i)=>(
          <text key={i} x={px(i)} y={H-3} textAnchor="middle" fill="var(--muted)" fontSize="7" fontFamily="var(--fm)">{d.day}</text>
        ))}
      </svg>
    </div>
  );
}

function Ring({value,max=100,color,size=78,label}){
  const stroke=6,r=(size-stroke*2)/2,circ=2*Math.PI*r;
  const pct=Math.min(value/max,1);
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={circ*(1-pct)}
          strokeLinecap="round"/>
        <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
          fill="var(--text)" fontSize={size*0.17} fontFamily="var(--fm)"
          style={{transform:"rotate(90deg)",transformOrigin:`${size/2}px ${size/2}px`}}>
          {Math.round(pct*100)}%
        </text>
      </svg>
      {label&&<span style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:0.8,textTransform:"uppercase"}}>{label}</span>}
    </div>
  );
}

function Bar({label,value,max=100,color}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:0.8}}>{label}</span>
        <span style={{fontFamily:"var(--fm)",fontSize:11,color}}>{value}{max!==100?`/${max}`:"%"}</span>
      </div>
      <div style={{height:5,background:"var(--border)",borderRadius:3}}>
        <div style={{height:"100%",width:`${Math.min(value/max,1)*100}%`,background:color,borderRadius:3,transition:"width 1s ease"}}/>
      </div>
    </div>
  );
}

function Card({label,value,unit,color,icon}){
  return(
    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,
      padding:"13px 15px",display:"flex",flexDirection:"column",gap:5,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:color,opacity:0.7}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:1}}>{label}</span>
        <span style={{fontSize:15}}>{icon}</span>
      </div>
      <div style={{display:"flex",alignItems:"baseline",gap:3}}>
        <span style={{fontFamily:"var(--fd)",fontSize:26,color,letterSpacing:1}}>{value??'—'}</span>
        {unit&&<span style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--muted)"}}>{unit}</span>}
      </div>
    </div>
  );
}

function H2({children}){
  return <h2 style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:2,color:"var(--text)",marginTop:4}}>{children}</h2>;
}

// ── Screens ───────────────────────────────────────────────────────────────────
function Dashboard(){
  const d=DEMO, ins=INSIGHTS;
  return(
    <div className="fade" style={{display:"flex",flexDirection:"column",gap:14}}>

      {/* Verdict + insight */}
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap",gap:8}}>
          <div style={{background:ins.verdictColor,color:"#000",borderRadius:8,padding:"5px 14px",
            fontFamily:"var(--fd)",fontSize:20,letterSpacing:3}}>{ins.verdict}</div>
          {[["OURA","var(--accent)"],["WHOOP","var(--gold)"],["CAL","var(--accent2)"]].map(([l,c])=>(
            <span key={l} style={{fontFamily:"var(--fm)",fontSize:9,color:c,
              border:`1px solid ${c}`,padding:"2px 7px",borderRadius:4}}>◐ {l}</span>
          ))}
        </div>
        <p style={{fontFamily:"var(--fb)",fontSize:13,color:"var(--text)",lineHeight:1.65}}>{ins.insight}</p>
      </div>

      {/* 6 key stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Card label="HRV"        value={d.oura.hrv}       unit="ms"   color="var(--accent)"  icon="💚"/>
        <Card label="Recovery"   value={d.whoop.recovery}  unit="%"    color="var(--gold)"    icon="🔋"/>
        <Card label="Readiness"  value={d.oura.readiness}  unit="/100" color="var(--accent3)" icon="⚡"/>
        <Card label="Sleep"      value={d.oura.totalSleep} unit="hrs"  color="var(--blue)"    icon="🌙"/>
        <Card label="Strain"     value={d.whoop.strain}    unit="/21"  color="var(--accent2)" icon="🔥"/>
        <Card label="Resting HR" value={d.oura.restingHR}  unit="bpm"  color="#ff9f43"        icon="❤️"/>
      </div>

      {/* Recovery rings */}
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}}>
        <H2>RECOVERY RINGS</H2>
        <div style={{display:"flex",justifyContent:"space-around",marginTop:14}}>
          <Ring value={d.oura.readiness}  color="var(--accent)"  label="Ready"/>
          <Ring value={d.whoop.recovery}  color="var(--gold)"    label="Recov"/>
          <Ring value={d.oura.sleepScore} color="var(--blue)"    label="Sleep"/>
          <Ring value={d.oura.spo2}       color="var(--accent3)" label="SpO2"/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:18}}>
          <Bar label="HRV"       value={d.oura.hrv}       max={100} color="var(--accent)"/>
          <Bar label="Recovery"  value={d.whoop.recovery}           color="var(--gold)"/>
          <Bar label="Readiness" value={d.oura.readiness}           color="var(--accent3)"/>
          <Bar label="Sleep hrs" value={Math.round(d.oura.totalSleep/9*100)} color="var(--blue)"/>
          <Bar label="Strain"    value={Math.round(d.whoop.strain/21*100)}   color="var(--accent2)"/>
        </div>
      </div>

      {/* 7-day HRV + Recovery dual */}
      <H2>7-DAY TRENDS</H2>
      <DualLineChart data={d.history} keyA="hrv" keyB="recovery" colorA="var(--accent)" colorB="var(--gold)" labelA="HRV" labelB="Recovery" h={100}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <LineChart data={d.history} valueKey="sleep"    color="var(--blue)"    unit="h" h={85}/>
        <LineChart data={d.history} valueKey="strain"   color="var(--accent2)" unit="" h={85}/>
        <LineChart data={d.history} valueKey="readiness"color="var(--accent3)" unit="" h={85}/>
        <LineChart data={d.history} valueKey="restHR"   color="#ff9f43"        unit="" h={85}/>
      </div>

      {/* Recovery tips */}
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}}>
        <H2>RECOVERY PROTOCOLS</H2>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:14}}>
          {ins.recovery.map((tip,i)=>(
            <div key={i} style={{display:"flex",gap:12}}>
              <span style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--accent)",flexShrink:0,paddingTop:1}}>
                {String(i+1).padStart(2,"0")}
              </span>
              <span style={{fontFamily:"var(--fb)",fontSize:13,lineHeight:1.55}}>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Biometrics(){
  const d=DEMO;
  return(
    <div className="fade" style={{display:"flex",flexDirection:"column",gap:14}}>
      <H2>OURA RING</H2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Card label="Readiness"   value={d.oura.readiness}  unit="/100" color="var(--accent)" icon="◈"/>
        <Card label="HRV"         value={d.oura.hrv}        unit="ms"   color="var(--accent)" icon="💚"/>
        <Card label="Resting HR"  value={d.oura.restingHR}  unit="bpm"  color="var(--accent)" icon="❤️"/>
        <Card label="Sleep Score" value={d.oura.sleepScore} unit="/100" color="var(--accent)" icon="🌙"/>
        <Card label="Deep Sleep"  value={d.oura.deepSleep}  unit="hrs"  color="var(--accent)" icon="🔵"/>
        <Card label="REM Sleep"   value={d.oura.remSleep}   unit="hrs"  color="var(--accent)" icon="🟣"/>
        <Card label="Total Sleep" value={d.oura.totalSleep} unit="hrs"  color="var(--accent)" icon="⏱️"/>
        <Card label="SpO2"        value={d.oura.spo2}       unit="%"    color="var(--accent)" icon="🫁"/>
        <Card label="Body Temp Δ" value={d.oura.bodyTemp}   unit="°C"   color="var(--accent)" icon="🌡️"/>
      </div>

      <H2>WHOOP</H2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Card label="Recovery"    value={d.whoop.recovery}       unit="%"    color="var(--gold)" icon="🟡"/>
        <Card label="Strain"      value={d.whoop.strain}         unit="/21"  color="var(--gold)" icon="🔥"/>
        <Card label="HRV"         value={d.whoop.hrv}            unit="ms"   color="var(--gold)" icon="💛"/>
        <Card label="Avg HR"      value={d.whoop.avgHR}          unit="bpm"  color="var(--gold)" icon="❤️"/>
        <Card label="Total Cal"   value={d.whoop.calories}       unit="kcal" color="var(--gold)" icon="⚡"/>
        <Card label="Active Cal"  value={d.whoop.activeCalories} unit="kcal" color="var(--gold)" icon="🏃"/>
        <Card label="Skin Temp"   value={d.whoop.skinTemp}       unit="°C"   color="var(--gold)" icon="🌡️"/>
      </div>

      <H2>7-DAY CHARTS</H2>
      {/* Sleep breakdown dual */}
      <DualLineChart data={d.history} keyA="deep" keyB="rem" colorA="var(--accent3)" colorB="var(--blue)" labelA="Deep" labelB="REM" unit="h" h={100}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <LineChart data={d.history} valueKey="hrv"       color="var(--accent)"  unit="ms" h={85}/>
        <LineChart data={d.history} valueKey="recovery"  color="var(--gold)"    unit="%"  h={85}/>
        <LineChart data={d.history} valueKey="readiness" color="var(--accent3)" unit=""   h={85}/>
        <LineChart data={d.history} valueKey="sleep"     color="var(--blue)"    unit="h"  h={85}/>
        <LineChart data={d.history} valueKey="restHR"    color="#ff9f43"        unit=""   h={85}/>
        <LineChart data={d.history} valueKey="spo2"      color="var(--accent3)" unit="%"  h={85}/>
        <LineChart data={d.history} valueKey="strain"    color="var(--accent2)" unit=""   h={85}/>
      </div>
    </div>
  );
}

function Workout(){
  const w=INSIGHTS.workout;
  return(
    <div className="fade" style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}}>
        <div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2,color:"var(--accent)",marginBottom:6}}>{w.focus}</div>
        <div style={{display:"flex",gap:16,fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)",marginBottom:12}}>
          <span>⏱ {w.duration}</span><span>⚡ {w.intensity}</span>
        </div>
        <div style={{background:"var(--surface)",borderRadius:8,padding:"10px 14px",fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)"}}>
          <span style={{color:"var(--accent)",fontWeight:600}}>WARM-UP  </span>{w.warmup}
        </div>
      </div>

      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden"}}>
        <div style={{padding:"13px 18px",background:"var(--surface)",borderBottom:"1px solid var(--border)"}}>
          <H2>EXERCISES</H2>
        </div>
        {w.exercises.map((ex,i)=>(
          <div key={i} style={{padding:"14px 18px",borderBottom:i<w.exercises.length-1?"1px solid var(--border)":"none"}}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontFamily:"var(--fd)",fontSize:20,color:"var(--accent)",flexShrink:0,letterSpacing:1}}>
                {String(i+1).padStart(2,"0")}
              </span>
              <div style={{flex:1}}>
                <div style={{fontFamily:"var(--fb)",fontWeight:700,fontSize:15,marginBottom:3}}>{ex.name}</div>
                {ex.note&&<div style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--muted)",marginBottom:8}}>{ex.note}</div>}
                <div style={{display:"flex",gap:8}}>
                  {[["SETS",ex.sets,"var(--text)"],["REPS",ex.reps,"var(--accent)"],["REST",ex.rest,"var(--muted)"]].map(([l,v,c])=>(
                    <div key={l} style={{background:"var(--surface)",borderRadius:7,padding:"5px 9px",textAlign:"center",minWidth:44}}>
                      <div style={{fontFamily:"var(--fd)",fontSize:15,color:c,letterSpacing:1}}>{v}</div>
                      <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div style={{padding:"11px 18px",background:"var(--surface)",borderTop:"1px solid var(--border)",
          fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)"}}>
          🧘 COOL-DOWN: {w.cooldown}
        </div>
      </div>
    </div>
  );
}

function Nutrition(){
  const d=DEMO,n=INSIGHTS.nutrition,c=d.calai;
  return(
    <div className="fade" style={{display:"flex",flexDirection:"column",gap:14}}>
      <H2>YESTERDAY'S INTAKE</H2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Card label="Calories" value={c.calories} unit="kcal" color="#ff9f43"        icon="🔥"/>
        <Card label="Protein"  value={c.protein}  unit="g"    color="var(--accent)"  icon="💪"/>
        <Card label="Carbs"    value={c.carbs}    unit="g"    color="var(--accent3)" icon="🌾"/>
        <Card label="Fat"      value={c.fat}      unit="g"    color="var(--gold)"    icon="🥑"/>
        <Card label="Fiber"    value={c.fiber}    unit="g"    color="var(--blue)"    icon="🥦"/>
        <Card label="Water"    value={c.water}    unit="L"    color="var(--blue)"    icon="💧"/>
      </div>

      <H2>AI TARGETS TODAY</H2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Card label="Calories" value={n.targetCalories} unit="kcal" color="var(--accent2)" icon="🎯"/>
        <Card label="Protein"  value={n.targetProtein}  unit="g"    color="var(--accent)"  icon="💪"/>
        <Card label="Carbs"    value={n.targetCarbs}    unit="g"    color="var(--accent3)" icon="🌾"/>
        <Card label="Fat"      value={n.targetFat}      unit="g"    color="var(--gold)"    icon="🥑"/>
      </div>

      {/* Progress vs target */}
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}}>
        <H2>TODAY VS TARGET</H2>
        <div style={{display:"flex",flexDirection:"column",gap:13,marginTop:14}}>
          <Bar label="Calories" value={Math.round(c.calories/n.targetCalories*100)} color="#ff9f43"/>
          <Bar label="Protein"  value={Math.round(c.protein/n.targetProtein*100)}   color="var(--accent)"/>
          <Bar label="Carbs"    value={Math.round(c.carbs/n.targetCarbs*100)}        color="var(--accent3)"/>
          <Bar label="Fat"      value={Math.round(c.fat/n.targetFat*100)}            color="var(--gold)"/>
          <Bar label="Water"    value={Math.round(c.water/3*100)}                    color="var(--blue)"/>
        </div>
      </div>

      {/* Macro dual chart */}
      <H2>7-DAY NUTRITION</H2>
      <DualLineChart data={d.history} keyA="protein" keyB="calories" colorA="var(--accent)" colorB="#ff9f43" labelA="Protein" labelB="Cals" h={100}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <BarChart data={d.history} valueKey="protein"  color="var(--accent)" unit="g"    target={n.targetProtein} h={80}/>
        <BarChart data={d.history} valueKey="calories" color="#ff9f43"       unit=""     target={n.targetCalories} h={80}/>
      </div>

      {/* Tips */}
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}}>
        <H2>NUTRITION TIPS</H2>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:14}}>
          {n.tips.map((tip,i)=>(
            <div key={i} style={{display:"flex",gap:12}}>
              <span style={{color:"var(--accent)",fontFamily:"var(--fm)",fontSize:12,flexShrink:0,paddingTop:1}}>→</span>
              <span style={{fontFamily:"var(--fb)",fontSize:13,lineHeight:1.55}}>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Profile(){
  const [p,setP]=useState({birthday:"",heightFt:"",heightIn:"",weightLbs:"",trainingAge:"",healthProblems:""});
  const set=(k,v)=>setP(prev=>({...prev,[k]:v}));
  const age=p.birthday?Math.floor((Date.now()-new Date(p.birthday))/(365.25*86400000)):null;
  const inp={background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,
    color:"var(--text)",padding:"11px 14px",fontFamily:"var(--fm)",fontSize:14,outline:"none",width:"100%"};
  const lbl={fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)",letterSpacing:1,
    textTransform:"uppercase",display:"block",marginBottom:6};
  const onF=e=>e.target.style.borderColor="var(--accent)";
  const onB=e=>e.target.style.borderColor="var(--border)";
  return(
    <div className="fade" style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}}>
        <H2>ATHLETE PROFILE</H2>
        <div style={{display:"flex",flexDirection:"column",gap:16,marginTop:16}}>

          <div>
            <label style={lbl}>Date of Birth</label>
            <input type="date" value={p.birthday||""} onChange={e=>set("birthday",e.target.value)}
              style={{...inp,colorScheme:"dark"}} onFocus={onF} onBlur={onB}
              max={new Date().toISOString().split("T")[0]}/>
            {age&&<p style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--accent)",marginTop:5}}>✓ {age} years old</p>}
          </div>

          <div>
            <label style={lbl}>Height</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{position:"relative"}}>
                <input type="number" min="3" max="8" value={p.heightFt||""} placeholder="5"
                  onChange={e=>set("heightFt",e.target.value)} style={inp} onFocus={onF} onBlur={onB}/>
                <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                  fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)",pointerEvents:"none"}}>ft</span>
              </div>
              <div style={{position:"relative"}}>
                <input type="number" min="0" max="11" value={p.heightIn||""} placeholder="10"
                  onChange={e=>set("heightIn",e.target.value)} style={inp} onFocus={onF} onBlur={onB}/>
                <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                  fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)",pointerEvents:"none"}}>in</span>
              </div>
            </div>
          </div>

          <div>
            <label style={lbl}>Weight</label>
            <div style={{position:"relative"}}>
              <input type="number" value={p.weightLbs||""} placeholder="175"
                onChange={e=>set("weightLbs",e.target.value)} style={inp} onFocus={onF} onBlur={onB}/>
              <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)",pointerEvents:"none"}}>lbs</span>
            </div>
            {p.weightLbs&&<p style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--accent)",marginTop:5}}>
              ✓ {(parseFloat(p.weightLbs)*0.453592).toFixed(1)} kg</p>}
          </div>

          <div>
            <label style={lbl}>Training Age (years lifting)</label>
            <div style={{position:"relative"}}>
              <input type="number" min="0" max="50" value={p.trainingAge||""} placeholder="3"
                onChange={e=>set("trainingAge",e.target.value)} style={inp} onFocus={onF} onBlur={onB}/>
              <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)",pointerEvents:"none"}}>yrs</span>
            </div>
          </div>

          <div>
            <label style={lbl}>Health Conditions / Injuries</label>
            <textarea value={p.healthProblems||""} onChange={e=>set("healthProblems",e.target.value)}
              placeholder="e.g. Lower back issues, no overhead pressing..." rows={3}
              style={{...inp,resize:"vertical",lineHeight:1.5}} onFocus={onF} onBlur={onB}/>
          </div>

          <button onClick={()=>alert("Profile saved! ✓")} style={{
            background:"var(--accent)",color:"#000",border:"none",borderRadius:10,
            padding:"14px",fontFamily:"var(--fb)",fontWeight:800,fontSize:14,letterSpacing:1,width:"100%"}}>
            SAVE PROFILE →
          </button>
        </div>
      </div>

      {/* Device connections */}
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}}>
        <H2>DEVICE CONNECTIONS</H2>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:14}}>
          {[
            {name:"OURA RING",color:"var(--accent)", status:"◐ DEMO",note:"After deploy: paste personal token from cloud.ouraring.com"},
            {name:"WHOOP",    color:"var(--gold)",   status:"◐ DEMO",note:"After deploy: tap Connect WHOOP to authorize via OAuth"},
            {name:"CAL AI",   color:"var(--accent2)",status:"◐ DEMO",note:"No public API — nutrition data is AI-simulated from your profile"},
          ].map(d=>(
            <div key={d.name} style={{background:"var(--surface)",borderRadius:10,padding:14,border:"1px solid var(--border)"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontFamily:"var(--fm)",fontSize:12,color:d.color,fontWeight:600}}>◈ {d.name}</span>
                <span style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--gold)"}}>{d.status}</span>
              </div>
              <p style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--muted)",lineHeight:1.5}}>{d.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Nav + App shell ───────────────────────────────────────────────────────────
const NAV=[
  {id:"dashboard", label:"Home",     icon:"◈"},
  {id:"biometrics",label:"Bio",      icon:"◉"},
  {id:"workout",   label:"Workout",  icon:"◆"},
  {id:"nutrition", label:"Nutrition",icon:"◇"},
  {id:"profile",   label:"Profile",  icon:"○"},
];

function ApexHealth(){
  const [tab,setTab]=useState("dashboard");
  return(
    <>
      <style>{STYLES}</style>
      <div style={{maxWidth:500,margin:"0 auto",minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column"}}>

        {/* Header */}
        <div style={{background:"var(--surface)",borderBottom:"1px solid var(--border)",
          padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:28,height:28,background:"var(--accent)",borderRadius:7,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontFamily:"var(--fd)",fontSize:17,color:"#000"}}>A</div>
            <span style={{fontFamily:"var(--fd)",fontSize:20,letterSpacing:3}}>APEX</span>
            <span style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>HEALTH OS</span>
          </div>
          <span style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)"}}>
            {new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
          </span>
        </div>

        {/* Content */}
        <div style={{flex:1,padding:"14px 14px 0"}}>
          {tab==="dashboard"  && <Dashboard/>}
          {tab==="biometrics" && <Biometrics/>}
          {tab==="workout"    && <Workout/>}
          {tab==="nutrition"  && <Nutrition/>}
          {tab==="profile"    && <Profile/>}
          <div style={{height:80}}/>
        </div>

        {/* Bottom nav */}
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
          width:"100%",maxWidth:500,background:"var(--surface)",borderTop:"1px solid var(--border)",
          display:"flex",zIndex:50}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)} style={{
              flex:1,background:"none",border:"none",padding:"10px 0 8px",
              display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              borderTop:tab===n.id?"2px solid var(--accent)":"2px solid transparent",
              color:tab===n.id?"var(--accent)":"var(--muted)"}}>
              <span style={{fontSize:15}}>{n.icon}</span>
              <span style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:0.5}}>{n.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ApexHealth));
