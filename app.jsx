const { useState, useEffect, useCallback } = React;

const S = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#060810;--surface:#0d1017;--card:#111520;--border:#1e2535;
--accent:#00e5a0;--accent2:#ff4d6d;--accent3:#7b61ff;--gold:#f5c542;
--blue:#5cc8ff;--text:#e8eaf0;--muted:#5a6380;
--fd:'Bebas Neue',sans-serif;--fb:'Syne',sans-serif;--fm:'DM Mono',monospace}
body{background:var(--bg);color:var(--text);font-family:var(--fb)}
button{cursor:pointer}input,textarea{font-family:var(--fm)}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.fade{animation:fadeUp 0.3s ease forwards}
@keyframes spin{to{transform:rotate(360deg)}}
`;

// ── localStorage ──
function ls(k,fb){try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb}catch{return fb}}
function ss(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}

// ── UI Components ──
function Card({label,value,unit,color,icon}){
  return(
    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,
      padding:"14px 16px",display:"flex",flexDirection:"column",gap:5,position:"relative",overflow:"hidden"}}>
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

function Ring({value,max=100,color,size=78,label}){
  const stroke=6,r=(size-stroke*2)/2,circ=2*Math.PI*r;
  const pct=Math.min((value||0)/max,1);
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round"/>
        <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
          fill="var(--text)" fontSize={size*0.17} fontFamily="var(--fm)"
          style={{transform:"rotate(90deg)",transformOrigin:size/2+"px "+size/2+"px"}}>
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
        <span style={{fontFamily:"var(--fm)",fontSize:11,color}}>{value}{max!==100?"/"+max:"%"}</span>
      </div>
      <div style={{height:5,background:"var(--border)",borderRadius:3}}>
        <div style={{height:"100%",width:Math.min((value||0)/max,1)*100+"%",background:color,borderRadius:3,transition:"width 1s ease"}}/>
      </div>
    </div>
  );
}

function H2({children}){return <h2 style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:2,color:"var(--text)",marginTop:4}}>{children}</h2>}

function Spinner(){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,padding:40}}>
      <div style={{width:36,height:36,border:"3px solid var(--border)",borderTop:"3px solid var(--accent)",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <span style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)"}}>Generating your workout...</span>
    </div>
  );
}

// ── Workout Day Logic ──
const SPLITS = [
  {day:"A", focus:"Chest + Triceps + Core", muscles:["chest","triceps","core"]},
  {day:"B", focus:"Back (rebuild) + Biceps", muscles:["back","biceps"]},
  {day:"C", focus:"Shoulders + Arms + Calves", muscles:["shoulders","arms","calves"]},
  {day:"D", focus:"Legs + Glutes + Back Rehab", muscles:["legs","glutes","back_rehab"]},
];

function getTodaySplit(){
  const dayNum = Math.floor(Date.now()/(86400000));
  return SPLITS[dayNum % SPLITS.length];
}

// ── Dashboard ──
function Dashboard({whoop, insights, onSync, syncing}){
  const verdict = !whoop.strain ? "SYNC TO START" :
    whoop.sleepScore && whoop.sleepScore < 50 ? "ACTIVE RECOVERY" :
    whoop.strain > 15 ? "TRAIN MODERATE" : "TRAIN HARD";
  const vColor = verdict==="TRAIN HARD"?"var(--accent)":verdict==="TRAIN MODERATE"?"var(--gold)":"var(--accent2)";
  const split = getTodaySplit();
  return(
    <div className="fade" style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
          <div style={{background:vColor,color:"#000",borderRadius:8,padding:"5px 14px",
            fontFamily:"var(--fd)",fontSize:18,letterSpacing:3}}>{verdict}</div>
          <span style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--gold)",
            border:"1px solid var(--gold)",padding:"2px 7px",borderRadius:4}}>
            {whoop.strain?"● WHOOP LIVE":"○ TAP SYNC"}
          </span>
        </div>
        {insights?.insight ? (
          <p style={{fontFamily:"var(--fb)",fontSize:13,color:"var(--text)",lineHeight:1.65}}>{insights.insight}</p>
        ) : (
          <p style={{fontFamily:"var(--fb)",fontSize:13,color:"var(--muted)",lineHeight:1.65}}>
            Today is <b style={{color:"var(--accent)"}}>{split.focus}</b> day. Tap SYNC to pull your WHOOP data and generate your personalized workout.
          </p>
        )}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Card label="Strain" value={whoop.strain} unit="/21" color="var(--accent2)" icon="🔥"/>
        <Card label="Sleep Score" value={whoop.sleepScore} unit="%" color="var(--blue)" icon="🌙"/>
        <Card label="Calories" value={whoop.calories} unit="kcal" color="var(--gold)" icon="⚡"/>
        <Card label="Avg HR" value={whoop.avgHR} unit="bpm" color="#ff9f43" icon="❤️"/>
      </div>

      {whoop.strain && (
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}}>
          <H2>TODAY'S STATUS</H2>
          <div style={{display:"flex",justifyContent:"space-around",marginTop:14}}>
            <Ring value={whoop.sleepScore||0} color="var(--blue)" size={76} label="Sleep"/>
            <Ring value={Math.round((whoop.strain||0)/21*100)} max={100} color="var(--accent2)" size={76} label="Strain"/>
            <Ring value={whoop.calories?Math.min(Math.round(whoop.calories/2500*100),100):0} color="var(--gold)" size={76} label="Cals"/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:16}}>
            <Bar label="Sleep Quality" value={whoop.sleepScore||0} color="var(--blue)"/>
            <Bar label="Day Strain" value={Math.round((whoop.strain||0)/21*100)} color="var(--accent2)"/>
            <Bar label="Calorie Burn" value={whoop.calories?Math.min(Math.round(whoop.calories/3000*100),100):0} color="var(--gold)"/>
          </div>
        </div>
      )}

      {insights?.recovery && (
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}}>
          <H2>RECOVERY PROTOCOLS</H2>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:14}}>
            {insights.recovery.map((tip,i)=>(
              <div key={i} style={{display:"flex",gap:12}}>
                <span style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--accent)",flexShrink:0,paddingTop:1}}>
                  {String(i+1).padStart(2,"0")}
                </span>
                <span style={{fontFamily:"var(--fb)",fontSize:13,lineHeight:1.55}}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Workout ──
function WorkoutScreen({workout, log, onLogUpdate}){
  if(!workout) return(
    <div className="fade" style={{textAlign:"center",padding:60,color:"var(--muted)",fontFamily:"var(--fm)",fontSize:13}}>
      Tap ↻ SYNC on the home screen to generate today's workout
    </div>
  );
  const w = workout;
  return(
    <div className="fade" style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}}>
        <div style={{fontFamily:"var(--fd)",fontSize:24,letterSpacing:2,color:"var(--accent)",marginBottom:6}}>{w.focus}</div>
        <div style={{display:"flex",gap:16,fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)",marginBottom:12}}>
          <span>⏱ {w.duration}</span><span>⚡ {w.intensity}</span>
        </div>
        <div style={{background:"var(--surface)",borderRadius:8,padding:"10px 14px",fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)"}}>
          <span style={{color:"var(--accent)",fontWeight:600}}>WARM-UP  </span>{w.warmup}
        </div>
      </div>

      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden"}}>
        <div style={{padding:"13px 18px",background:"var(--surface)",borderBottom:"1px solid var(--border)"}}>
          <H2>EXERCISES — LOG YOUR WEIGHT</H2>
        </div>
        {(w.exercises||[]).map((ex,i)=>{
          const exLog = (log||{})[i] || {};
          return(
            <div key={i} style={{padding:"14px 18px",borderBottom:i<w.exercises.length-1?"1px solid var(--border)":"none"}}>
              <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:10}}>
                <span style={{fontFamily:"var(--fd)",fontSize:20,color:"var(--accent)",flexShrink:0,letterSpacing:1}}>
                  {String(i+1).padStart(2,"0")}
                </span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"var(--fb)",fontWeight:700,fontSize:15,marginBottom:3}}>{ex.name}</div>
                  {ex.note&&<div style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--muted)",marginBottom:6}}>{ex.note}</div>}
                  <div style={{display:"flex",gap:8,marginBottom:10}}>
                    {[["SETS",ex.sets,"var(--text)"],["REPS",ex.reps,"var(--accent)"],["REST",ex.rest,"var(--muted)"]].map(([l,v,c])=>(
                      <div key={l} style={{background:"var(--surface)",borderRadius:7,padding:"5px 9px",textAlign:"center",minWidth:44}}>
                        <div style={{fontFamily:"var(--fd)",fontSize:15,color:c,letterSpacing:1}}>{v}</div>
                        <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Weight logging per set */}
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginLeft:32}}>
                {Array.from({length:parseInt(ex.sets)||4},(_,s)=>(
                  <div key={s} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    <span style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>S{s+1}</span>
                    <input
                      type="number"
                      placeholder="lbs"
                      value={exLog["s"+s]||""}
                      onChange={e=>{
                        const newLog={...(log||{})};
                        if(!newLog[i])newLog[i]={};
                        newLog[i]["s"+s]=e.target.value;
                        onLogUpdate(newLog);
                      }}
                      style={{
                        width:52,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:6,
                        color:"var(--text)",padding:"6px 4px",fontFamily:"var(--fm)",fontSize:12,
                        textAlign:"center",outline:"none"
                      }}
                      onFocus={e=>e.target.style.borderColor="var(--accent)"}
                      onBlur={e=>e.target.style.borderColor="var(--border)"}
                    />
                    <input
                      type="number"
                      placeholder="reps"
                      value={exLog["r"+s]||""}
                      onChange={e=>{
                        const newLog={...(log||{})};
                        if(!newLog[i])newLog[i]={};
                        newLog[i]["r"+s]=e.target.value;
                        onLogUpdate(newLog);
                      }}
                      style={{
                        width:52,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:6,
                        color:"var(--accent)",padding:"4px 4px",fontFamily:"var(--fm)",fontSize:11,
                        textAlign:"center",outline:"none"
                      }}
                      onFocus={e=>e.target.style.borderColor="var(--accent)"}
                      onBlur={e=>e.target.style.borderColor="var(--border)"}
                    />
                  </div>
                ))}
                <div style={{display:"flex",alignItems:"center"}}>
                  {exLog.done?
                    <span style={{color:"var(--accent)",fontFamily:"var(--fm)",fontSize:11}}>✓</span>:
                    <button onClick={()=>{
                      const newLog={...(log||{})};
                      if(!newLog[i])newLog[i]={};
                      newLog[i].done=true;
                      onLogUpdate(newLog);
                    }} style={{background:"var(--accent)",color:"#000",border:"none",borderRadius:6,
                      padding:"8px 10px",fontFamily:"var(--fm)",fontSize:10,letterSpacing:0.5}}>
                      DONE
                    </button>
                  }
                </div>
              </div>
            </div>
          );
        })}
        <div style={{padding:"11px 18px",background:"var(--surface)",borderTop:"1px solid var(--border)",
          fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)"}}>
          🧘 COOL-DOWN: {w.cooldown}
        </div>
      </div>
    </div>
  );
}

// ── History ──
function History({logs}){
  const entries = Object.entries(logs).sort((a,b)=>b[0].localeCompare(a[0]));
  if(entries.length===0) return(
    <div className="fade" style={{textAlign:"center",padding:60,color:"var(--muted)",fontFamily:"var(--fm)",fontSize:13}}>
      No workout logs yet. Complete a workout to see history.
    </div>
  );
  return(
    <div className="fade" style={{display:"flex",flexDirection:"column",gap:14}}>
      <H2>WORKOUT HISTORY</H2>
      {entries.map(([date,entry])=>(
        <div key={date} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <span style={{fontFamily:"var(--fd)",fontSize:16,letterSpacing:1,color:"var(--accent)"}}>{entry.focus||"Workout"}</span>
            <span style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--muted)"}}>{date}</span>
          </div>
          {entry.exercises&&entry.exercises.map((ex,i)=>{
            const exLog=(entry.log||{})[i]||{};
            const weights=Object.entries(exLog).filter(([k])=>k.startsWith("s")).map(([,v])=>v).filter(Boolean);
            if(weights.length===0)return null;
            return(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"6px 0",borderTop:i>0?"1px solid var(--border)":"none"}}>
                <span style={{fontFamily:"var(--fb)",fontSize:13,flex:1}}>{ex.name}</span>
                <span style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--accent)"}}>
                  {weights.join(" / ")} lbs
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Profile ──
function Profile({profile,onSave,onConnect}){
  const [p,setP]=useState(profile);
  const [saved,setSaved]=useState(false);
  const set=(k,v)=>setP(prev=>({...prev,[k]:v}));
  const age=p.birthday?Math.floor((Date.now()-new Date(p.birthday))/(365.25*86400000)):null;
  const inp={background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,
    color:"var(--text)",padding:"11px 14px",fontFamily:"var(--fm)",fontSize:14,outline:"none",width:"100%"};
  const lbl={fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:6};
  const onF=e=>e.target.style.borderColor="var(--accent)";
  const onB=e=>e.target.style.borderColor="var(--border)";
  return(
    <div className="fade" style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}}>
        <H2>ATHLETE PROFILE</H2>
        <div style={{display:"flex",flexDirection:"column",gap:16,marginTop:16}}>
          <div><label style={lbl}>Date of Birth</label>
            <input type="date" value={p.birthday||""} onChange={e=>set("birthday",e.target.value)}
              style={{...inp,colorScheme:"dark"}} onFocus={onF} onBlur={onB} max={new Date().toISOString().split("T")[0]}/>
            {age&&<p style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--accent)",marginTop:5}}>✓ {age} years old</p>}
          </div>
          <div><label style={lbl}>Height</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{position:"relative"}}><input type="number" min="3" max="8" value={p.heightFt||""} placeholder="5"
                onChange={e=>set("heightFt",e.target.value)} style={inp} onFocus={onF} onBlur={onB}/>
                <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)",pointerEvents:"none"}}>ft</span></div>
              <div style={{position:"relative"}}><input type="number" min="0" max="11" value={p.heightIn||""} placeholder="10"
                onChange={e=>set("heightIn",e.target.value)} style={inp} onFocus={onF} onBlur={onB}/>
                <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)",pointerEvents:"none"}}>in</span></div>
            </div></div>
          <div><label style={lbl}>Weight</label>
            <div style={{position:"relative"}}><input type="number" value={p.weightLbs||""} placeholder="175"
              onChange={e=>set("weightLbs",e.target.value)} style={inp} onFocus={onF} onBlur={onB}/>
              <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)",pointerEvents:"none"}}>lbs</span></div></div>
          <div><label style={lbl}>Training Age (years lifting)</label>
            <div style={{position:"relative"}}><input type="number" min="0" max="50" value={p.trainingAge||""} placeholder="3"
              onChange={e=>set("trainingAge",e.target.value)} style={inp} onFocus={onF} onBlur={onB}/>
              <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)",pointerEvents:"none"}}>yrs</span></div></div>
          <div><label style={lbl}>Health Conditions / Injuries</label>
            <textarea value={p.healthProblems||""} onChange={e=>set("healthProblems",e.target.value)}
              placeholder="e.g. L5-S1 fusion Jan 2025, lower back tightness..." rows={3}
              style={{...inp,resize:"vertical",lineHeight:1.5}} onFocus={onF} onBlur={onB}/></div>
          <button onClick={()=>{onSave(p);setSaved(true);setTimeout(()=>setSaved(false),3000)}} style={{
            background:"var(--accent)",color:"#000",border:"none",borderRadius:10,
            padding:"14px",fontFamily:"var(--fb)",fontWeight:800,fontSize:14,letterSpacing:1,width:"100%"}}>
            {saved?"✓ SAVED!":"SAVE PROFILE →"}</button>
        </div>
      </div>

      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}}>
        <H2>WHOOP CONNECTION</H2>
        <div style={{marginTop:14}}>
          <button onClick={onConnect} style={{
            background:"var(--gold)",color:"#000",border:"none",borderRadius:8,
            padding:"12px 20px",fontFamily:"var(--fb)",fontWeight:700,fontSize:13,
            letterSpacing:1,width:"100%"}}>CONNECT / RECONNECT WHOOP →</button>
          <p style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--muted)",marginTop:10,textAlign:"center"}}>
            Connects directly to your WHOOP for strain, sleep, calories, and heart rate data.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──
const NAV=[
  {id:"home",    label:"Home",    icon:"◈"},
  {id:"workout", label:"Workout", icon:"◆"},
  {id:"history", label:"History", icon:"◉"},
  {id:"profile", label:"Profile", icon:"○"},
];

function ForgeHealth(){
  const [tab,setTab]=useState("home");
  const [profile,setProfile]=useState(()=>ls("forge_profile",{birthday:"",heightFt:"",heightIn:"",weightLbs:"",trainingAge:"",healthProblems:"L5-S1 fusion Jan 2025"}));
  const [whoop,setWhoop]=useState(()=>ls("forge_whoop",{strain:null,calories:null,avgHR:null,sleepScore:null,totalSleep:null}));
  const [insights,setInsights]=useState(()=>ls("forge_insights",null));
  const [workout,setWorkout]=useState(()=>ls("forge_workout_"+new Date().toISOString().split("T")[0],null));
  const [workoutLog,setWorkoutLog]=useState(()=>ls("forge_log_"+new Date().toISOString().split("T")[0],{}));
  const [allLogs,setAllLogs]=useState(()=>ls("forge_all_logs",{}));
  const [syncing,setSyncing]=useState(false);

  const today = new Date().toISOString().split("T")[0];

  const saveLog=(newLog)=>{
    setWorkoutLog(newLog);
    ss("forge_log_"+today,newLog);
    if(workout){
      const updated={...allLogs,[today]:{focus:workout.focus,exercises:workout.exercises,log:newLog}};
      setAllLogs(updated);
      ss("forge_all_logs",updated);
    }
  };

  const syncData=async()=>{
    setSyncing(true);
    try{
const r=await fetch("/api/whoop/daily",{credentials:"include"});
      if(r.ok){
        const d=await r.json();
    setWhoop(d);ss("forge_whoop",d);
        try{await generateWorkout(d);}catch(err){alert("Workout error: "+err.message);}
      }
    }catch(e){alert("Sync error: "+e.message)}
    setSyncing(false);
  };

  const generateWorkout=async(whoopData)=>{
    const split=getTodaySplit();
    const p=profile;
    const prompt=`You are an elite strength coach. Athlete has L5-S1 spinal fusion (Jan 2025). Lower back muscles need rebuilding but NO spinal compression, NO conventional deadlifts, NO barbell squats, NO standing overhead press. ALWAYS 10-min warmup (cat-cow, bird-dog, glute bridges). Core: dead bug, pallof press only.
CARDIO: incline walk, swimming, elliptical, stationary bike only.
Allowed back exercises: back extensions, cable pull-throughs, hip thrusts, seated rows, lat pulldowns.

Athlete: ${p.heightFt||"?"}ft ${p.heightIn||"?"}in, ${p.weightLbs||"?"}lbs, training ${p.trainingAge||"?"}yrs
Health: ${p.healthProblems||"L5-S1 fusion"}

WHOOP today: Strain ${whoopData.strain||"unknown"}/21, Sleep Score ${whoopData.sleepScore||"unknown"}%, Calories ${whoopData.calories||"unknown"}, Avg HR ${whoopData.avgHR||"unknown"}bpm

Today's split: ${split.focus}
${whoopData.sleepScore&&whoopData.sleepScore<50?"IMPORTANT: Sleep score is very low. Reduce volume by 30%, lower intensity, focus on technique.":""}
${whoopData.strain&&whoopData.strain>16?"IMPORTANT: Strain is very high already. This should be a lighter session.":""}

Respond ONLY in JSON:
{"insight":"2-3 sentences using the real WHOOP numbers","focus":"${split.focus}","duration":"60-75 min","intensity":"High","warmup":"specific warmup for today","exercises":[{"name":"Exercise Name","sets":4,"reps":"6-8","rest":"2 min","note":"coaching tip"}],"cooldown":"specific cooldown","recovery":["tip1","tip2","tip3"]}`;

    try{
      const r=await fetch("/api/workout",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({prompt:prompt})
      });
      const d=await r.json();
const txt=d.content?.map(b=>b.text||"").join("")||"{}";
      alert("AI response: "+txt.substring(0,100));
      const w=JSON.parse(txt.replace(/```json|```/g,"").trim());
      setWorkout(w);ss("forge_workout_"+today,w);
      setInsights(w);ss("forge_insights",w);
    }catch(e){alert("Error: "+e.message)}
  };

  useEffect(()=>{
    const cached=ls("forge_whoop",null);
    if(cached&&(cached.strain||cached.calories))setWhoop(cached);
  },[]);

  return(
    <>
      <style>{S}</style>
      <div style={{maxWidth:500,margin:"0 auto",minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column"}}>
        <div style={{background:"var(--surface)",borderBottom:"1px solid var(--border)",
          padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:28,height:28,background:"var(--accent)",borderRadius:7,
              display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fd)",fontSize:17,color:"#000"}}>F</div>
            <span style={{fontFamily:"var(--fd)",fontSize:20,letterSpacing:3}}>FORGE</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)"}}>
              {new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
            </span>
            <button onClick={syncData} disabled={syncing} style={{
              background:"var(--card)",border:"1px solid var(--accent)",color:"var(--accent)",
              borderRadius:6,padding:"4px 12px",fontFamily:"var(--fm)",fontSize:10,cursor:"pointer",
              opacity:syncing?0.6:1}}>
              {syncing?"SYNCING...":"↻ SYNC"}
            </button>
          </div>
        </div>
        <div style={{flex:1,padding:"14px 14px 0"}}>
          {syncing&&!workout&&<Spinner/>}
          {tab==="home"&&<Dashboard whoop={whoop} insights={insights} onSync={syncData} syncing={syncing}/>}
          {tab==="workout"&&<WorkoutScreen workout={workout} log={workoutLog} onLogUpdate={saveLog}/>}
          {tab==="history"&&<History logs={allLogs}/>}
          {tab==="profile"&&<Profile profile={profile} onSave={p=>{setProfile(p);ss("forge_profile",p)}} onConnect={()=>{window.location.href="/api/whoop/auth"}}/>}
          <div style={{height:80}}/>
        </div>
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
          width:"100%",maxWidth:500,background:"var(--surface)",borderTop:"1px solid var(--border)",display:"flex",zIndex:50}}>
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

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ForgeHealth));
