const { useState, useEffect } = React;

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
@keyframes spin{to{transform:rotate(360deg)}}
`;

function ls(k,fb){try{var v=localStorage.getItem(k);return v?JSON.parse(v):fb}catch(e){return fb}}
function ss(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}

function Card(props){
  return(
    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,
      padding:"14px 16px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:props.color,opacity:0.7}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
        <span style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:1}}>{props.label}</span>
        <span style={{fontSize:15}}>{props.icon}</span>
      </div>
      <div style={{display:"flex",alignItems:"baseline",gap:3}}>
        <span style={{fontFamily:"var(--fd)",fontSize:26,color:props.color,letterSpacing:1}}>{props.value!=null?props.value:"—"}</span>
        {props.unit&&<span style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--muted)"}}>{props.unit}</span>}
      </div>
    </div>
  );
}

function Ring(props){
  var size=props.size||78,stroke=6,r=(size-stroke*2)/2,circ=2*Math.PI*r;
  var pct=Math.min((props.value||0)/(props.max||100),1);
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={props.color}
          strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round"/>
        <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
          fill="var(--text)" fontSize={size*0.17} fontFamily="var(--fm)"
          style={{transform:"rotate(90deg)",transformOrigin:size/2+"px "+size/2+"px"}}>
          {Math.round(pct*100)}%
        </text>
      </svg>
      {props.label&&<span style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:0.8,textTransform:"uppercase"}}>{props.label}</span>}
    </div>
  );
}

function Bar(props){
  var pct=Math.min((props.value||0)/(props.max||100),1)*100;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:0.8}}>{props.label}</span>
        <span style={{fontFamily:"var(--fm)",fontSize:11,color:props.color}}>{props.value}{props.max!==100?"/"+props.max:"%"}</span>
      </div>
      <div style={{height:5,background:"var(--border)",borderRadius:3}}>
        <div style={{height:"100%",width:pct+"%",background:props.color,borderRadius:3}}/>
      </div>
    </div>
  );
}

var SPLITS=[
  {day:"A",focus:"Chest + Triceps + Core"},
  {day:"B",focus:"Back (rebuild) + Biceps"},
  {day:"C",focus:"Shoulders + Arms + Calves"},
  {day:"D",focus:"Legs + Glutes + Back Rehab"},
];
function getTodaySplit(){
  var d=Math.floor(Date.now()/86400000);
  return SPLITS[d%SPLITS.length];
}

function ForgeHealth(){
  var today=new Date().toISOString().split("T")[0];
  var _tab=useState("home");var tab=_tab[0];var setTab=_tab[1];
  var _w=useState(function(){return ls("forge_whoop",{})});var whoop=_w[0];var setWhoop=_w[1];
  var _wo=useState(function(){return ls("forge_workout_"+today,null)});var workout=_wo[0];var setWorkout=_wo[1];
  var _ins=useState(function(){return ls("forge_insights",null)});var insights=_ins[0];var setInsights=_ins[1];
  var _log=useState(function(){return ls("forge_log_"+today,{})});var workoutLog=_log[0];var setWorkoutLog=_log[1];
  var _logs=useState(function(){return ls("forge_all_logs",{})});var allLogs=_logs[0];var setAllLogs=_logs[1];
  var _pro=useState(function(){return ls("forge_profile",{birthday:"",heightFt:"",heightIn:"",weightLbs:"",trainingAge:"",healthProblems:"L5-S1 fusion Jan 2025"})});
  var profile=_pro[0];var setProfile=_pro[1];
  var _sync=useState(false);var syncing=_sync[0];var setSyncing=_sync[1];
  var _msg=useState("");var statusMsg=_msg[0];var setStatusMsg=_msg[1];

  function saveLog(newLog){
    setWorkoutLog(newLog);
    ss("forge_log_"+today,newLog);
    if(workout){
      var updated=Object.assign({},allLogs);
      updated[today]={focus:workout.focus,exercises:workout.exercises,log:newLog};
      setAllLogs(updated);
      ss("forge_all_logs",updated);
    }
  }

  function doSync(){
    setSyncing(true);
    setStatusMsg("Fetching WHOOP data...");
    fetch("/api/whoop/daily",{credentials:"include"})
      .then(function(r){return r.json()})
      .then(function(d){
        setWhoop(d);
        ss("forge_whoop",d);
        setStatusMsg("Generating workout...");
        return doGenerateWorkout(d);
      })
      .then(function(){
        setStatusMsg("");
        setSyncing(false);
      })
      .catch(function(e){
        setStatusMsg("Error: "+e.message);
        setSyncing(false);
      });
  }

  function doGenerateWorkout(whoopData){
    var split=getTodaySplit();
    var p=profile;
    var prompt="You are an elite strength coach. Athlete has L5-S1 spinal fusion (Jan 2025). Lower back muscles need rebuilding but NO spinal compression, NO conventional deadlifts, NO barbell squats, NO standing overhead press. ALWAYS 10-min warmup (cat-cow, bird-dog, glute bridges). Core: dead bug, pallof press only. CARDIO: incline walk, swimming, elliptical, stationary bike only. Allowed back exercises: back extensions, cable pull-throughs, hip thrusts, seated rows, lat pulldowns.\n\n";
    prompt+="Athlete: "+(p.heightFt||"?")+"ft "+(p.heightIn||"?")+"in, "+(p.weightLbs||"?")+"lbs, training "+(p.trainingAge||"?")+"yrs\n";
    prompt+="Health: "+(p.healthProblems||"L5-S1 fusion")+"\n\n";
    prompt+="WHOOP today: Strain "+(whoopData.strain||"unknown")+"/21, Sleep Score "+(whoopData.sleepScore||"unknown")+"%, Calories "+(whoopData.calories||"unknown")+", Avg HR "+(whoopData.avgHR||"unknown")+"bpm\n\n";
    prompt+="Today's split: "+split.focus+"\n\n";
    if(whoopData.sleepScore&&whoopData.sleepScore<50)prompt+="IMPORTANT: Sleep score is very low. Reduce volume by 30%, lower intensity.\n";
    if(whoopData.strain&&whoopData.strain>16)prompt+="IMPORTANT: Strain is very high already. Lighter session.\n";
    prompt+='\nRespond ONLY in JSON, no markdown:\n{"insight":"2-3 sentences using real WHOOP numbers","focus":"'+split.focus+'","duration":"60-75 min","intensity":"High","warmup":"specific warmup","exercises":[{"name":"Exercise Name","sets":4,"reps":"6-8","rest":"2 min","note":"coaching tip"}],"cooldown":"specific cooldown","recovery":["tip1","tip2","tip3"]}';

    return fetch("/api/workout",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({prompt:prompt})
    })
    .then(function(r){return r.json()})
    .then(function(d){
      var txt="";
      if(d.content){
        for(var i=0;i<d.content.length;i++){
          if(d.content[i].text)txt+=d.content[i].text;
        }
      }
      if(!txt)return;
      txt=txt.replace(/```json/g,"").replace(/```/g,"").trim();
      var w=JSON.parse(txt);
      setWorkout(w);ss("forge_workout_"+today,w);
      setInsights(w);ss("forge_insights",w);
    });
  }

  // --- RENDER ---
  var split=getTodaySplit();
  var verdict=!whoop.strain?"SYNC TO START":
    whoop.sleepScore&&whoop.sleepScore<50?"ACTIVE RECOVERY":
    whoop.strain>15?"TRAIN MODERATE":"TRAIN HARD";
  var vColor=verdict==="TRAIN HARD"?"var(--accent)":verdict==="TRAIN MODERATE"?"var(--gold)":"var(--accent2)";

  return(
    <div>
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
            <button onClick={doSync} disabled={syncing} style={{
              background:"var(--card)",border:"1px solid var(--accent)",color:"var(--accent)",
              borderRadius:6,padding:"4px 12px",fontFamily:"var(--fm)",fontSize:10,
              opacity:syncing?0.6:1}}>
              {syncing?"SYNCING...":"↻ SYNC"}
            </button>
          </div>
        </div>

        {statusMsg&&<div style={{background:"var(--surface)",padding:"8px 18px",fontFamily:"var(--fm)",fontSize:11,color:"var(--accent)",textAlign:"center"}}>{statusMsg}</div>}

        <div style={{flex:1,padding:"14px 14px 0",paddingBottom:80}}>

          {tab==="home"&&(
            <div>
              <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18,marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
                  <div style={{background:vColor,color:"#000",borderRadius:8,padding:"5px 14px",
                    fontFamily:"var(--fd)",fontSize:18,letterSpacing:3}}>{verdict}</div>
                  <span style={{fontFamily:"var(--fm)",fontSize:10,color:whoop.strain?"var(--accent)":"var(--muted)",
                    border:"1px solid "+(whoop.strain?"var(--accent)":"var(--border)"),padding:"2px 7px",borderRadius:4}}>
                    {whoop.strain?"● WHOOP LIVE":"○ TAP SYNC"}
                  </span>
                </div>
                {insights&&insights.insight?(
                  <p style={{fontFamily:"var(--fb)",fontSize:13,color:"var(--text)",lineHeight:1.65}}>{insights.insight}</p>
                ):(
                  <p style={{fontFamily:"var(--fb)",fontSize:13,color:"var(--muted)",lineHeight:1.65}}>
                    Today is <b style={{color:"var(--accent)"}}>{split.focus}</b> day. Tap SYNC to pull your WHOOP data and generate your personalized workout.
                  </p>
                )}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <Card label="Strain" value={whoop.strain} unit="/21" color="var(--accent2)" icon="🔥"/>
                <Card label="Sleep Score" value={whoop.sleepScore} unit="%" color="var(--blue)" icon="🌙"/>
                <Card label="Calories" value={whoop.calories} unit="kcal" color="var(--gold)" icon="⚡"/>
                <Card label="Avg HR" value={whoop.avgHR} unit="bpm" color="#ff9f43" icon="❤️"/>
              </div>

              {whoop.strain&&(
                <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18,marginBottom:14}}>
                  <h2 style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:2,marginBottom:14}}>TODAY'S STATUS</h2>
                  <div style={{display:"flex",justifyContent:"space-around",marginBottom:16}}>
                    <Ring value={whoop.sleepScore||0} color="var(--blue)" size={76} label="Sleep"/>
                    <Ring value={Math.round((whoop.strain||0)/21*100)} max={100} color="var(--accent2)" size={76} label="Strain"/>
                    <Ring value={whoop.calories?Math.min(Math.round(whoop.calories/2500*100),100):0} color="var(--gold)" size={76} label="Cals"/>
                  </div>
                  <Bar label="Sleep Quality" value={whoop.sleepScore||0} max={100} color="var(--blue)"/>
                  <div style={{height:10}}/>
                  <Bar label="Day Strain" value={Math.round((whoop.strain||0)/21*100)} max={100} color="var(--accent2)"/>
                </div>
              )}

              {insights&&insights.recovery&&(
                <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}}>
                  <h2 style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:2,marginBottom:14}}>RECOVERY TIPS</h2>
                  {insights.recovery.map(function(tip,i){
                    return <div key={i} style={{display:"flex",gap:12,marginBottom:10}}>
                      <span style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--accent)",flexShrink:0}}>{String(i+1).padStart(2,"0")}</span>
                      <span style={{fontFamily:"var(--fb)",fontSize:13,lineHeight:1.55}}>{tip}</span>
                    </div>
                  })}
                </div>
              )}
            </div>
          )}

          {tab==="workout"&&(
            <div>
              {!workout?(
                <div style={{textAlign:"center",padding:60,color:"var(--muted)",fontFamily:"var(--fm)",fontSize:13}}>
                  Tap ↻ SYNC on home screen to generate today's workout
                </div>
              ):(
                <div>
                  <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18,marginBottom:14}}>
                    <div style={{fontFamily:"var(--fd)",fontSize:24,letterSpacing:2,color:"var(--accent)",marginBottom:6}}>{workout.focus}</div>
                    <div style={{display:"flex",gap:16,fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)",marginBottom:12}}>
                      <span>⏱ {workout.duration}</span><span>⚡ {workout.intensity}</span>
                    </div>
                    <div style={{background:"var(--surface)",borderRadius:8,padding:"10px 14px",fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)"}}>
                      <span style={{color:"var(--accent)",fontWeight:600}}>WARM-UP  </span>{workout.warmup}
                    </div>
                  </div>

                  <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden"}}>
                    <div style={{padding:"13px 18px",background:"var(--surface)",borderBottom:"1px solid var(--border)"}}>
                      <h2 style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:2}}>EXERCISES — LOG YOUR WEIGHT</h2>
                    </div>
                    {(workout.exercises||[]).map(function(ex,i){
                      var exLog=(workoutLog||{})[i]||{};
                      var numSets=parseInt(ex.sets)||4;
                      return <div key={i} style={{padding:"14px 18px",borderBottom:i<workout.exercises.length-1?"1px solid var(--border)":"none"}}>
                        <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:10}}>
                          <span style={{fontFamily:"var(--fd)",fontSize:20,color:"var(--accent)",flexShrink:0}}>{String(i+1).padStart(2,"0")}</span>
                          <div style={{flex:1}}>
                            <div style={{fontFamily:"var(--fb)",fontWeight:700,fontSize:15,marginBottom:3}}>{ex.name}</div>
                            {ex.note&&<div style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--muted)",marginBottom:6}}>{ex.note}</div>}
                            <div style={{display:"flex",gap:8,marginBottom:10}}>
                              <div style={{background:"var(--surface)",borderRadius:7,padding:"5px 9px",textAlign:"center",minWidth:44}}>
                                <div style={{fontFamily:"var(--fd)",fontSize:15,color:"var(--text)"}}>{ex.sets}</div>
                                <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>SETS</div>
                              </div>
                              <div style={{background:"var(--surface)",borderRadius:7,padding:"5px 9px",textAlign:"center",minWidth:44}}>
                                <div style={{fontFamily:"var(--fd)",fontSize:15,color:"var(--accent)"}}>{ex.reps}</div>
                                <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>REPS</div>
                              </div>
                              <div style={{background:"var(--surface)",borderRadius:7,padding:"5px 9px",textAlign:"center",minWidth:44}}>
                                <div style={{fontFamily:"var(--fd)",fontSize:15,color:"var(--muted)"}}>{ex.rest}</div>
                                <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>REST</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginLeft:32}}>
                          {Array.from({length:numSets},function(_,s){
                            return <div key={s} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                              <span style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>S{s+1}</span>
                              <input type="number" placeholder="lbs" value={exLog["s"+s]||""}
                                onChange={function(e){var nl=Object.assign({},workoutLog);if(!nl[i])nl[i]={};nl[i]["s"+s]=e.target.value;saveLog(nl);}}
                                style={{width:52,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:6,
                                  color:"var(--text)",padding:"6px 4px",fontFamily:"var(--fm)",fontSize:12,textAlign:"center",outline:"none"}}/>
                              <input type="number" placeholder="reps" value={exLog["r"+s]||""}
                                onChange={function(e){var nl=Object.assign({},workoutLog);if(!nl[i])nl[i]={};nl[i]["r"+s]=e.target.value;saveLog(nl);}}
                                style={{width:52,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:6,
                                  color:"var(--accent)",padding:"4px 4px",fontFamily:"var(--fm)",fontSize:11,textAlign:"center",outline:"none"}}/>
                            </div>
                          })}
                        </div>
                      </div>
                    })}
                    <div style={{padding:"11px 18px",background:"var(--surface)",borderTop:"1px solid var(--border)",
                      fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)"}}>
                      🧘 COOL-DOWN: {workout.cooldown}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab==="history"&&(
            <div>
              <h2 style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:2,marginBottom:14}}>WORKOUT HISTORY</h2>
              {Object.keys(allLogs).length===0?(
                <div style={{textAlign:"center",padding:60,color:"var(--muted)",fontFamily:"var(--fm)",fontSize:13}}>No workout logs yet.</div>
              ):(
                Object.entries(allLogs).sort(function(a,b){return b[0].localeCompare(a[0])}).map(function(entry){
                  var date=entry[0];var data=entry[1];
                  return <div key={date} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:16,marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                      <span style={{fontFamily:"var(--fd)",fontSize:16,color:"var(--accent)"}}>{data.focus||"Workout"}</span>
                      <span style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--muted)"}}>{date}</span>
                    </div>
                    {data.exercises&&data.exercises.map(function(ex,i){
                      var exLog=(data.log||{})[i]||{};
                      var weights=Object.keys(exLog).filter(function(k){return k.startsWith("s")}).map(function(k){return exLog[k]}).filter(Boolean);
                      if(weights.length===0)return null;
                      return <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",
                        borderTop:i>0?"1px solid var(--border)":"none"}}>
                        <span style={{fontFamily:"var(--fb)",fontSize:13}}>{ex.name}</span>
                        <span style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--accent)"}}>{weights.join(" / ")} lbs</span>
                      </div>
                    })}
                  </div>
                })
              )}
            </div>
          )}

          {tab==="profile"&&(
            <div>
              <ProfileForm profile={profile} onSave={function(p){setProfile(p);ss("forge_profile",p)}}/>
              <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18,marginTop:14}}>
                <h2 style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:2,marginBottom:14}}>WHOOP CONNECTION</h2>
                <button onClick={function(){window.location.href="/api/whoop/auth"}} style={{
                  background:"var(--gold)",color:"#000",border:"none",borderRadius:8,
                  padding:"12px 20px",fontFamily:"var(--fb)",fontWeight:700,fontSize:13,letterSpacing:1,width:"100%"}}>
                  CONNECT / RECONNECT WHOOP
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
          width:"100%",maxWidth:500,background:"var(--surface)",borderTop:"1px solid var(--border)",display:"flex",zIndex:50}}>
          {[["home","Home","◈"],["workout","Workout","◆"],["history","History","◉"],["profile","Profile","○"]].map(function(n){
            return <button key={n[0]} onClick={function(){setTab(n[0])}} style={{
              flex:1,background:"none",border:"none",padding:"10px 0 8px",
              display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              borderTop:tab===n[0]?"2px solid var(--accent)":"2px solid transparent",
              color:tab===n[0]?"var(--accent)":"var(--muted)"}}>
              <span style={{fontSize:15}}>{n[2]}</span>
              <span style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:0.5}}>{n[1]}</span>
            </button>
          })}
        </div>
      </div>
    </div>
  );
}

function ProfileForm(props){
  var _p=useState(props.profile);var p=_p[0];var setP=_p[1];
  var _s=useState(false);var saved=_s[0];var setSaved=_s[1];
  function set(k,v){setP(function(prev){var n=Object.assign({},prev);n[k]=v;return n})}
  var age=p.birthday?Math.floor((Date.now()-new Date(p.birthday))/(365.25*86400000)):null;
  var inp={background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,
    color:"var(--text)",padding:"11px 14px",fontFamily:"var(--fm)",fontSize:14,outline:"none",width:"100%"};
  var lbl={fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:6};
  return(
    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}}>
      <h2 style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:2,marginBottom:16}}>ATHLETE PROFILE</h2>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div><label style={lbl}>Date of Birth</label>
          <input type="date" value={p.birthday||""} onChange={function(e){set("birthday",e.target.value)}}
            style={Object.assign({},inp,{colorScheme:"dark"})} max={new Date().toISOString().split("T")[0]}/>
          {age&&<p style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--accent)",marginTop:5}}>✓ {age} years old</p>}
        </div>
        <div><label style={lbl}>Height</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{position:"relative"}}><input type="number" min="3" max="8" value={p.heightFt||""} placeholder="5"
              onChange={function(e){set("heightFt",e.target.value)}} style={inp}/>
              <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)",pointerEvents:"none"}}>ft</span></div>
            <div style={{position:"relative"}}><input type="number" min="0" max="11" value={p.heightIn||""} placeholder="10"
              onChange={function(e){set("heightIn",e.target.value)}} style={inp}/>
              <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)",pointerEvents:"none"}}>in</span></div>
          </div></div>
        <div><label style={lbl}>Weight</label>
          <div style={{position:"relative"}}><input type="number" value={p.weightLbs||""} placeholder="175"
            onChange={function(e){set("weightLbs",e.target.value)}} style={inp}/>
            <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)",pointerEvents:"none"}}>lbs</span></div></div>
        <div><label style={lbl}>Training Age</label>
          <div style={{position:"relative"}}><input type="number" min="0" max="50" value={p.trainingAge||""} placeholder="3"
            onChange={function(e){set("trainingAge",e.target.value)}} style={inp}/>
            <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)",pointerEvents:"none"}}>yrs</span></div></div>
        <div><label style={lbl}>Health Conditions / Injuries</label>
          <textarea value={p.healthProblems||""} onChange={function(e){set("healthProblems",e.target.value)}}
            placeholder="e.g. L5-S1 fusion Jan 2025..." rows={3}
            style={Object.assign({},inp,{resize:"vertical",lineHeight:1.5})}/></div>
        <button onClick={function(){props.onSave(p);setSaved(true);setTimeout(function(){setSaved(false)},3000)}} style={{
          background:"var(--accent)",color:"#000",border:"none",borderRadius:10,
          padding:"14px",fontFamily:"var(--fb)",fontWeight:800,fontSize:14,letterSpacing:1,width:"100%"}}>
          {saved?"✓ SAVED!":"SAVE PROFILE →"}
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ForgeHealth));
