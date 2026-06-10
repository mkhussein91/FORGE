var useState = React.useState;
var useEffect = React.useEffect;

var S = '@import url(\'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap\');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}:root{--bg:#060810;--surface:#0d1017;--card:#111520;--border:#1e2535;--accent:#00e5a0;--accent2:#ff4d6d;--gold:#f5c542;--blue:#5cc8ff;--text:#e8eaf0;--muted:#5a6380;--fd:\'Bebas Neue\',sans-serif;--fb:\'Syne\',sans-serif;--fm:\'DM Mono\',monospace}body{background:var(--bg);color:var(--text);font-family:var(--fb)}button{cursor:pointer}input,textarea{font-family:var(--fm)}@keyframes spin{to{transform:rotate(360deg)}}';

function ls(k,fb){try{var v=localStorage.getItem(k);return v?JSON.parse(v):fb}catch(e){return fb}}
function ss(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}

function Card(p){
  return React.createElement("div",{style:{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"14px 16px",position:"relative",overflow:"hidden"}},
    React.createElement("div",{style:{position:"absolute",top:0,left:0,right:0,height:2,background:p.color}}),
    React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:5}},
      React.createElement("span",{style:{fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:1}},p.label),
      React.createElement("span",{style:{fontSize:15}},p.icon)
    ),
    React.createElement("div",{style:{display:"flex",alignItems:"baseline",gap:3}},
      React.createElement("span",{style:{fontFamily:"var(--fd)",fontSize:26,color:p.color,letterSpacing:1}},p.value!=null?p.value:"—"),
      p.unit&&React.createElement("span",{style:{fontFamily:"var(--fm)",fontSize:11,color:"var(--muted)"}},p.unit)
    )
  );
}

var SPLITS=[
  {day:"A",focus:"Chest + Triceps + Core"},
  {day:"B",focus:"Back (rebuild) + Biceps"},
  {day:"C",focus:"Shoulders + Arms + Calves"},
  {day:"D",focus:"Legs + Glutes + Back Rehab"}
];

function getTodaySplit(){
  return SPLITS[Math.floor(Date.now()/86400000)%SPLITS.length];
}

function ForgeHealth(){
  var today=new Date().toISOString().split("T")[0];
  var t=useState("home"); var tab=t[0]; var setTab=t[1];
  var w=useState(function(){return ls("forge_whoop",{})}); var whoop=w[0]; var setWhoop=w[1];
  var wo=useState(function(){return ls("forge_workout_"+today,null)}); var workout=wo[0]; var setWorkout=wo[1];
  var ins=useState(function(){return ls("forge_insights",null)}); var insights=ins[0]; var setInsights=ins[1];
  var lg=useState(function(){return ls("forge_log_"+today,{})}); var wLog=lg[0]; var setWLog=lg[1];
  var al=useState(function(){return ls("forge_all_logs",{})}); var allLogs=al[0]; var setAllLogs=al[1];
  var pr=useState(function(){return ls("forge_profile",{birthday:"",heightFt:"",heightIn:"",weightLbs:"",trainingAge:"",healthProblems:"L5-S1 fusion Jan 2025"})}); var profile=pr[0]; var setProfile=pr[1];
  var sy=useState(false); var syncing=sy[0]; var setSyncing=sy[1];
  var ms=useState(""); var msg=ms[0]; var setMsg=ms[1];

  function saveLog(newLog){
    setWLog(newLog);
    ss("forge_log_"+today,newLog);
    if(workout){
      var u=Object.assign({},allLogs);
      u[today]={focus:workout.focus,exercises:workout.exercises,log:newLog};
      setAllLogs(u);
      ss("forge_all_logs",u);
    }
  }

  function doSync(){
    setSyncing(true);
    setMsg("Fetching WHOOP data...");
    fetch("/api/whoop/daily",{credentials:"include"})
      .then(function(r){return r.json();})
      .then(function(d){
        setWhoop(d);
        ss("forge_whoop",d);
        setMsg("Generating your workout...");
        return doGenerate(d);
      })
      .then(function(){
        setMsg("");
        setSyncing(false);
        setTab("workout");
      })
      })
      .catch(function(e){
        setMsg("Sync error: "+e.message);
        setSyncing(false);
      });
  }

  function doGenerate(wd){
    var split=getTodaySplit();
    var p=profile;
    var prompt="You are an elite strength coach. Athlete has L5-S1 spinal fusion (Jan 2025). RULES: NO conventional deadlifts, NO barbell squats, NO standing overhead press. ALWAYS 10min warmup (cat-cow, bird-dog, glute bridges). Core: dead bug, pallof press only. Allowed: back extensions, cable pull-throughs, hip thrusts, seated rows, lat pulldowns, incline press, dumbbell press, machine work.\n\n";
    prompt+="Athlete: "+(p.heightFt||"?")+"ft "+(p.heightIn||"?")+"in, "+(p.weightLbs||"?")+"lbs, "+(p.trainingAge||"?")+" yrs training\n";
    prompt+="Conditions: "+(p.healthProblems||"L5-S1 fusion Jan 2025")+"\n\n";
    prompt+="WHOOP today: Strain "+(wd.strain||"?")+"/21, Sleep "+(wd.sleepScore||"?")+"%, Calories "+(wd.calories||"?")+" kcal, Avg HR "+(wd.avgHR||"?")+" bpm\n\n";
    prompt+="Today split: "+split.focus+"\n";
    if(wd.sleepScore&&wd.sleepScore<50)prompt+="Sleep very low - reduce volume 30%, focus on technique.\n";
    if(wd.strain&&wd.strain>16)prompt+="Strain already high - lighter session today.\n";
    prompt+="\nReturn ONLY valid JSON, no markdown, no explanation:\n";
    prompt+="{\"insight\":\"2-3 sentences about today based on actual WHOOP numbers\",\"focus\":\""+split.focus+"\",\"duration\":\"65 min\",\"intensity\":\"Moderate-High\",\"warmup\":\"10 min: cat-cow x10, bird-dog 3x10, glute bridges 3x15\",\"exercises\":[{\"name\":\"Incline Dumbbell Press\",\"sets\":4,\"reps\":\"8-10\",\"rest\":\"2 min\",\"note\":\"control the descent\"}],\"cooldown\":\"10 min L5-S1 stretch: figure-4, hip flexor, cat-cow\",\"recovery\":[\"tip1\",\"tip2\",\"tip3\"]}";

    return fetch("/api/workout",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({prompt:prompt})
    })
    .then(function(r){return r.json();})
    .then(function(d){
      var txt="";
      if(d&&d.content&&d.content.length>0){
        for(var i=0;i<d.content.length;i++){
          if(d.content[i].text)txt+=d.content[i].text;
        }
      }
      if(!txt)return;
      txt=txt.trim();
      var start=txt.indexOf("{");
      var end=txt.lastIndexOf("}");
      if(start>=0&&end>=0){
        txt=txt.substring(start,end+1);
      }
      var parsed=JSON.parse(txt);
      setWorkout(parsed);
      ss("forge_workout_"+today,parsed);
      setInsights(parsed);
      ss("forge_insights",parsed);
    })
    .catch(function(e){
      setMsg("Workout error: "+e.message);
    });
  }

  var split=getTodaySplit();
  var verdict=!whoop.strain?"SYNC TO START":whoop.sleepScore&&whoop.sleepScore<50?"ACTIVE RECOVERY":whoop.strain>15?"TRAIN MODERATE":"TRAIN HARD";
  var vColor=verdict==="TRAIN HARD"?"var(--accent)":verdict==="TRAIN MODERATE"?"var(--gold)":"var(--accent2)";

  return React.createElement("div",null,
    React.createElement("style",null,S),
    React.createElement("div",{style:{maxWidth:500,margin:"0 auto",minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column"}},

      // Header
      React.createElement("div",{style:{background:"var(--surface)",borderBottom:"1px solid var(--border)",padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}},
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10}},
          React.createElement("div",{style:{width:28,height:28,background:"var(--accent)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fd)",fontSize:17,color:"#000"}},"F"),
          React.createElement("span",{style:{fontFamily:"var(--fd)",fontSize:20,letterSpacing:3}},"FORGE")
        ),
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
          React.createElement("span",{style:{fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)"}},new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})),
          React.createElement("button",{onClick:doSync,disabled:syncing,style:{background:"var(--card)",border:"1px solid var(--accent)",color:"var(--accent)",borderRadius:6,padding:"4px 12px",fontFamily:"var(--fm)",fontSize:10,opacity:syncing?0.6:1}},syncing?"SYNCING...":"↻ SYNC")
        )
      ),

      // Status bar
      msg?React.createElement("div",{style:{background:"var(--surface)",padding:"8px 18px",fontFamily:"var(--fm)",fontSize:11,color:"var(--accent)",textAlign:"center",borderBottom:"1px solid var(--border)"}},msg):null,

      // Content
      React.createElement("div",{style:{flex:1,padding:"14px",paddingBottom:90}},

        // HOME TAB
        tab==="home"?React.createElement("div",null,
          React.createElement("div",{style:{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18,marginBottom:14}},
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}},
              React.createElement("div",{style:{background:vColor,color:"#000",borderRadius:8,padding:"5px 14px",fontFamily:"var(--fd)",fontSize:18,letterSpacing:3}},verdict),
              React.createElement("span",{style:{fontFamily:"var(--fm)",fontSize:10,color:whoop.strain?"var(--accent)":"var(--muted)",border:"1px solid "+(whoop.strain?"var(--accent)":"var(--border)"),padding:"2px 7px",borderRadius:4}},whoop.strain?"● WHOOP LIVE":"○ TAP SYNC")
            ),
            React.createElement("p",{style:{fontFamily:"var(--fb)",fontSize:13,lineHeight:1.65,color:insights&&insights.insight?"var(--text)":"var(--muted)"}},
              insights&&insights.insight?insights.insight:"Today is "+split.focus+" day. Tap SYNC to load WHOOP data and generate your workout."
            )
          ),
          React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}},
            React.createElement(Card,{label:"Strain",value:whoop.strain,unit:"/21",color:"var(--accent2)",icon:"🔥"}),
            React.createElement(Card,{label:"Sleep Score",value:whoop.sleepScore,unit:"%",color:"var(--blue)",icon:"🌙"}),
            React.createElement(Card,{label:"Calories",value:whoop.calories,unit:"kcal",color:"var(--gold)",icon:"⚡"}),
            React.createElement(Card,{label:"Avg HR",value:whoop.avgHR,unit:"bpm",color:"#ff9f43",icon:"❤️"})
          ),
          insights&&insights.recovery?React.createElement("div",{style:{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}},
            React.createElement("h2",{style:{fontFamily:"var(--fd)",fontSize:18,letterSpacing:2,marginBottom:14}},"RECOVERY TIPS"),
            insights.recovery.map(function(tip,i){
              return React.createElement("div",{key:i,style:{display:"flex",gap:12,marginBottom:10}},
                React.createElement("span",{style:{fontFamily:"var(--fm)",fontSize:11,color:"var(--accent)",flexShrink:0}},String(i+1).padStart(2,"0")),
                React.createElement("span",{style:{fontFamily:"var(--fb)",fontSize:13,lineHeight:1.55}},tip)
              );
            })
          ):null
        ):null,

        // WORKOUT TAB
        tab==="workout"?React.createElement("div",null,
          !workout?React.createElement("div",{style:{textAlign:"center",padding:60,color:"var(--muted)",fontFamily:"var(--fm)",fontSize:13}},"Tap ↻ SYNC on home screen to generate today's workout"):
          React.createElement("div",null,
            React.createElement("div",{style:{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18,marginBottom:14}},
              React.createElement("div",{style:{fontFamily:"var(--fd)",fontSize:22,letterSpacing:2,color:"var(--accent)",marginBottom:6}},workout.focus),
              React.createElement("div",{style:{display:"flex",gap:16,fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)",marginBottom:12}},
                React.createElement("span",null,"⏱ "+workout.duration),
                React.createElement("span",null,"⚡ "+workout.intensity)
              ),
              React.createElement("div",{style:{background:"var(--surface)",borderRadius:8,padding:"10px 14px",fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)"}},
                React.createElement("span",{style:{color:"var(--accent)",fontWeight:600}},"WARM-UP  "),
                workout.warmup
              )
            ),
            React.createElement("div",{style:{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden",marginBottom:14}},
              React.createElement("div",{style:{padding:"13px 18px",background:"var(--surface)",borderBottom:"1px solid var(--border)"}},
                React.createElement("h2",{style:{fontFamily:"var(--fd)",fontSize:16,letterSpacing:2}},"EXERCISES — LOG YOUR WEIGHT")
              ),
              (workout.exercises||[]).map(function(ex,i){
                var exLog=(wLog||{})[i]||{};
                var sets=parseInt(ex.sets)||4;
                return React.createElement("div",{key:i,style:{padding:"14px 18px",borderBottom:i<workout.exercises.length-1?"1px solid var(--border)":"none"}},
                  React.createElement("div",{style:{marginBottom:10}},
                    React.createElement("div",{style:{display:"flex",gap:8,alignItems:"center",marginBottom:4}},
                      React.createElement("span",{style:{fontFamily:"var(--fd)",fontSize:18,color:"var(--accent)"}},(i+1)+"."),
                      React.createElement("span",{style:{fontFamily:"var(--fb)",fontWeight:700,fontSize:15}},ex.name)
                    ),
                    ex.note&&React.createElement("div",{style:{fontFamily:"var(--fm)",fontSize:11,color:"var(--muted)",marginBottom:8,marginLeft:22}},ex.note),
                    React.createElement("div",{style:{display:"flex",gap:8,marginLeft:22}},
                      React.createElement("div",{style:{background:"var(--surface)",borderRadius:7,padding:"4px 8px",textAlign:"center"}},
                        React.createElement("div",{style:{fontFamily:"var(--fd)",fontSize:14,color:"var(--text)"}},ex.sets),
                        React.createElement("div",{style:{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}},"SETS")
                      ),
                      React.createElement("div",{style:{background:"var(--surface)",borderRadius:7,padding:"4px 8px",textAlign:"center"}},
                        React.createElement("div",{style:{fontFamily:"var(--fd)",fontSize:14,color:"var(--accent)"}},ex.reps),
                        React.createElement("div",{style:{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}},"REPS")
                      ),
                      React.createElement("div",{style:{background:"var(--surface)",borderRadius:7,padding:"4px 8px",textAlign:"center"}},
                        React.createElement("div",{style:{fontFamily:"var(--fd)",fontSize:14,color:"var(--muted)"}},ex.rest),
                        React.createElement("div",{style:{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}},"REST")
                      )
                    )
                  ),
                  React.createElement("div",{style:{display:"flex",gap:6,flexWrap:"wrap",marginLeft:22}},
                    Array.from({length:sets},function(_,s){
                      return React.createElement("div",{key:s,style:{display:"flex",flexDirection:"column",alignItems:"center",gap:2}},
                        React.createElement("span",{style:{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}},"S"+(s+1)),
                        React.createElement("input",{type:"number",placeholder:"lbs",value:exLog["s"+s]||"",
                          onChange:function(e){var nl=Object.assign({},wLog);if(!nl[i])nl[i]={};nl[i]["s"+s]=e.target.value;saveLog(nl);},
                          style:{width:50,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:6,color:"var(--text)",padding:"5px 3px",fontFamily:"var(--fm)",fontSize:12,textAlign:"center",outline:"none"}}),
                        React.createElement("input",{type:"number",placeholder:"reps",value:exLog["r"+s]||"",
                          onChange:function(e){var nl=Object.assign({},wLog);if(!nl[i])nl[i]={};nl[i]["r"+s]=e.target.value;saveLog(nl);},
                          style:{width:50,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:6,color:"var(--accent)",padding:"4px 3px",fontFamily:"var(--fm)",fontSize:11,textAlign:"center",outline:"none"}})
                      );
                    })
                  )
                );
              }),
              React.createElement("div",{style:{padding:"11px 18px",background:"var(--surface)",borderTop:"1px solid var(--border)",fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)"}},
                "🧘 COOL-DOWN: "+workout.cooldown
              )
            )
          )
        ):null,

        // HISTORY TAB
        tab==="history"?React.createElement("div",null,
          React.createElement("h2",{style:{fontFamily:"var(--fd)",fontSize:18,letterSpacing:2,marginBottom:14}},"WORKOUT HISTORY"),
          Object.keys(allLogs).length===0?
            React.createElement("div",{style:{textAlign:"center",padding:60,color:"var(--muted)",fontFamily:"var(--fm)",fontSize:13}},"No workout logs yet."):
            Object.entries(allLogs).sort(function(a,b){return b[0].localeCompare(a[0]);}).map(function(entry){
              var date=entry[0]; var data=entry[1];
              return React.createElement("div",{key:date,style:{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:16,marginBottom:12}},
                React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:10}},
                  React.createElement("span",{style:{fontFamily:"var(--fd)",fontSize:16,color:"var(--accent)"}},data.focus||"Workout"),
                  React.createElement("span",{style:{fontFamily:"var(--fm)",fontSize:11,color:"var(--muted)"}},date)
                ),
                (data.exercises||[]).map(function(ex,i){
                  var exLog=(data.log||{})[i]||{};
                  var weights=Object.keys(exLog).filter(function(k){return k.startsWith("s");}).map(function(k){return exLog[k];}).filter(Boolean);
                  if(!weights.length)return null;
                  return React.createElement("div",{key:i,style:{display:"flex",justifyContent:"space-between",padding:"6px 0",borderTop:i>0?"1px solid var(--border)":"none"}},
                    React.createElement("span",{style:{fontFamily:"var(--fb)",fontSize:13}},ex.name),
                    React.createElement("span",{style:{fontFamily:"var(--fm)",fontSize:12,color:"var(--accent)"}},weights.join(" / ")+" lbs")
                  );
                })
              );
            })
        ):null,

        // PROFILE TAB
        tab==="profile"?React.createElement(ProfileForm,{profile:profile,onSave:function(p){setProfile(p);ss("forge_profile",p);}}):null

      ),

      // Bottom nav
      React.createElement("div",{style:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:500,background:"var(--surface)",borderTop:"1px solid var(--border)",display:"flex",zIndex:50}},
        [["home","Home","◈"],["workout","Workout","◆"],["history","History","◉"],["profile","Profile","○"]].map(function(n){
          return React.createElement("button",{key:n[0],onClick:function(){setTab(n[0]);},style:{flex:1,background:"none",border:"none",padding:"10px 0 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,borderTop:tab===n[0]?"2px solid var(--accent)":"2px solid transparent",color:tab===n[0]?"var(--accent)":"var(--muted)"}},
            React.createElement("span",{style:{fontSize:15}},n[2]),
            React.createElement("span",{style:{fontFamily:"var(--fm)",fontSize:9,letterSpacing:0.5}},n[1])
          );
        })
      )
    )
  );
}

function ProfileForm(p){
  var s=useState(p.profile); var prof=s[0]; var setProf=s[1];
  var sv=useState(false); var saved=sv[0]; var setSaved=sv[1];
  function set(k,v){setProf(function(prev){var n=Object.assign({},prev);n[k]=v;return n;})}
  var age=prof.birthday?Math.floor((Date.now()-new Date(prof.birthday))/(365.25*86400000)):null;
  var inp={background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",padding:"11px 14px",fontFamily:"var(--fm)",fontSize:14,outline:"none",width:"100%"};
  return React.createElement("div",null,
    React.createElement("div",{style:{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18,marginBottom:14}},
      React.createElement("h2",{style:{fontFamily:"var(--fd)",fontSize:18,letterSpacing:2,marginBottom:16}},"ATHLETE PROFILE"),
      React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:14}},
        React.createElement("div",null,
          React.createElement("label",{style:{fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)",display:"block",marginBottom:6,letterSpacing:1,textTransform:"uppercase"}},"Date of Birth"),
          React.createElement("input",{type:"date",value:prof.birthday||"",onChange:function(e){set("birthday",e.target.value);},style:Object.assign({},inp,{colorScheme:"dark"}),max:new Date().toISOString().split("T")[0]}),
          age&&React.createElement("p",{style:{fontFamily:"var(--fm)",fontSize:11,color:"var(--accent)",marginTop:5}},"✓ "+age+" years old")
        ),
        React.createElement("div",null,
          React.createElement("label",{style:{fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)",display:"block",marginBottom:6,letterSpacing:1,textTransform:"uppercase"}},"Height"),
          React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}},
            React.createElement("input",{type:"number",placeholder:"5 (ft)",value:prof.heightFt||"",onChange:function(e){set("heightFt",e.target.value);},style:inp}),
            React.createElement("input",{type:"number",placeholder:"10 (in)",value:prof.heightIn||"",onChange:function(e){set("heightIn",e.target.value);},style:inp})
          )
        ),
        React.createElement("div",null,
          React.createElement("label",{style:{fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)",display:"block",marginBottom:6,letterSpacing:1,textTransform:"uppercase"}},"Weight (lbs)"),
          React.createElement("input",{type:"number",placeholder:"175",value:prof.weightLbs||"",onChange:function(e){set("weightLbs",e.target.value);},style:inp})
        ),
        React.createElement("div",null,
          React.createElement("label",{style:{fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)",display:"block",marginBottom:6,letterSpacing:1,textTransform:"uppercase"}},"Training Age (years lifting)"),
          React.createElement("input",{type:"number",placeholder:"3",value:prof.trainingAge||"",onChange:function(e){set("trainingAge",e.target.value);},style:inp})
        ),
        React.createElement("div",null,
          React.createElement("label",{style:{fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)",display:"block",marginBottom:6,letterSpacing:1,textTransform:"uppercase"}},"Health Conditions / Injuries"),
          React.createElement("textarea",{value:prof.healthProblems||"",onChange:function(e){set("healthProblems",e.target.value);},placeholder:"e.g. L5-S1 fusion Jan 2025, lower back tightness...",rows:3,style:Object.assign({},inp,{resize:"vertical",lineHeight:1.5})})
        ),
        React.createElement("button",{onClick:function(){p.onSave(prof);setSaved(true);setTimeout(function(){setSaved(false);},3000);},style:{background:"var(--accent)",color:"#000",border:"none",borderRadius:10,padding:"14px",fontFamily:"var(--fb)",fontWeight:800,fontSize:14,letterSpacing:1,width:"100%"}},
          saved?"✓ SAVED!":"SAVE PROFILE →"
        )
      )
    ),
    React.createElement("div",{style:{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}},
      React.createElement("h2",{style:{fontFamily:"var(--fd)",fontSize:18,letterSpacing:2,marginBottom:14}},"WHOOP CONNECTION"),
      React.createElement("button",{onClick:function(){window.location.href="/api/whoop/auth";},style:{background:"var(--gold)",color:"#000",border:"none",borderRadius:8,padding:"12px 20px",fontFamily:"var(--fb)",fontWeight:700,fontSize:13,letterSpacing:1,width:"100%"}},
        "CONNECT / RECONNECT WHOOP"
      ),
      React.createElement("p",{style:{fontFamily:"var(--fm)",fontSize:11,color:"var(--muted)",marginTop:10,textAlign:"center"}},"Connects to your WHOOP for strain, sleep, calories and heart rate data.")
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(ForgeHealth));
