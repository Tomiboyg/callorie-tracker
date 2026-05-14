// ═══ STATE ═══
let sb, currentUser, isAdmin=false, selectedDate=new Date(), goals={kcal:2000,protein:150,carbs:250,fat:65}, modalFood=null;
const ADMIN_EMAIL='admin@nutritrack.sk';
const MEALS=[
  {id:'breakfast',name:'Raňajky',emoji:'🌅'},
  {id:'lunch',name:'Obed',emoji:'☀️'},
  {id:'dinner',name:'Večera',emoji:'🌙'},
  {id:'snack',name:'Snack',emoji:'🍪'}
];
const DEFAULT_FOODS=[
  {name:'Kuracie prsia',brand:'',category:'mäso',serving_size:100,unit:'g',kcal:165,protein:31,carbs:0,fat:3.6,fiber:0,sugar:0,salt:0.1},
  {name:'Ryža biela varená',brand:'',category:'pečivo',serving_size:100,unit:'g',kcal:130,protein:2.7,carbs:28,fat:0.3,fiber:0.4,sugar:0,salt:0},
  {name:'Vajce varené',brand:'',category:'ostatné',serving_size:60,unit:'g',kcal:91,protein:7.6,carbs:0.6,fat:6.4,fiber:0,sugar:0.6,salt:0.2},
  {name:'Banán',brand:'',category:'ovocie',serving_size:120,unit:'g',kcal:107,protein:1.3,carbs:27,fat:0.4,fiber:2.6,sugar:14,salt:0},
  {name:'Ovsené vločky',brand:'',category:'pečivo',serving_size:100,unit:'g',kcal:379,protein:13.2,carbs:67.7,fat:6.5,fiber:10.1,sugar:1,salt:0},
  {name:'Cottage cheese',brand:'',category:'mliečne',serving_size:100,unit:'g',kcal:98,protein:11,carbs:3.4,fat:4.3,fiber:0,sugar:2.7,salt:0.4},
  {name:'Grécky jogurt',brand:'',category:'mliečne',serving_size:150,unit:'g',kcal:88,protein:15,carbs:5.7,fat:0.8,fiber:0,sugar:5.7,salt:0.1},
  {name:'Chlieb celozrnný',brand:'',category:'pečivo',serving_size:50,unit:'g',kcal:122,protein:5.6,carbs:20,fat:1.8,fiber:3.5,sugar:2,salt:0.5},
  {name:'Avokádo',brand:'',category:'ovocie',serving_size:100,unit:'g',kcal:160,protein:2,carbs:8.5,fat:14.7,fiber:6.7,sugar:0.7,salt:0},
  {name:'Losos',brand:'',category:'mäso',serving_size:100,unit:'g',kcal:208,protein:20,carbs:0,fat:13,fiber:0,sugar:0,salt:0.1},
  {name:'Jablko',brand:'',category:'ovocie',serving_size:150,unit:'g',kcal:78,protein:0.4,carbs:21,fat:0.2,fiber:3.6,sugar:15.6,salt:0},
  {name:'Arašidové maslo',brand:'',category:'orechy',serving_size:32,unit:'g',kcal:190,protein:7,carbs:7,fat:16,fiber:1.6,sugar:3,salt:0.2},
  {name:'Proteínový shake',brand:'',category:'nápoje',serving_size:30,unit:'g',kcal:120,protein:24,carbs:3,fat:1.5,fiber:0,sugar:1,salt:0.2},
  {name:'Tuniak v konzerve',brand:'',category:'mäso',serving_size:100,unit:'g',kcal:116,protein:25.5,carbs:0,fat:1,fiber:0,sugar:0,salt:0.4},
  {name:'Brokolica',brand:'',category:'zelenina',serving_size:100,unit:'g',kcal:34,protein:2.8,carbs:7,fat:0.4,fiber:2.6,sugar:1.7,salt:0},
  {name:'Sladký zemiak',brand:'',category:'zelenina',serving_size:100,unit:'g',kcal:86,protein:1.6,carbs:20,fat:0.1,fiber:3,sugar:4.2,salt:0},
  {name:'Olivový olej',brand:'',category:'tuky',serving_size:15,unit:'ml',kcal:120,protein:0,carbs:0,fat:14,fiber:0,sugar:0,salt:0},
  {name:'Mandle',brand:'',category:'orechy',serving_size:30,unit:'g',kcal:173,protein:6.3,carbs:2,fat:15,fiber:3.7,sugar:1,salt:0},
  {name:'Tvaroh',brand:'',category:'mliečne',serving_size:100,unit:'g',kcal:72,protein:12.5,carbs:3,fat:0.5,fiber:0,sugar:3,salt:0.3},
  {name:'Špagetá varené',brand:'',category:'pečivo',serving_size:100,unit:'g',kcal:158,protein:5.8,carbs:31,fat:0.9,fiber:1.8,sugar:0.6,salt:0}
];

// ═══ HELPERS ═══
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const toast=(msg,type='info')=>{
  const t=document.createElement('div');
  t.className=`toast ${type}`;
  t.innerHTML=`<span>${type==='success'?'✅':type==='error'?'❌':'ℹ️'}</span> ${msg}`;
  $('#toast-container').appendChild(t);
  setTimeout(()=>t.remove(),3500);
};
const fmtDate=d=>{const dd=new Date(d);return dd.toLocaleDateString('sk-SK',{weekday:'long',day:'numeric',month:'long',year:'numeric'})};
const dateStr=d=>{const dd=new Date(d);return `${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`};

// ═══ SETUP ═══
(function initSetup(){
  const saved=localStorage.getItem('nt_supabase');
  if(saved){const{url,key}=JSON.parse(saved);initSupabase(url,key);}
  $('#setup-connect').onclick=()=>{
    const url=$('#setup-url').value.trim(), key=$('#setup-key').value.trim();
    if(!url||!key)return toast('Vyplň oba polia','error');
    localStorage.setItem('nt_supabase',JSON.stringify({url,key}));
    initSupabase(url,key);
  };
})();

async function initSupabase(url,key){
  try{
    sb=window.supabase.createClient(url,key);
    const{data}=await sb.auth.getSession();
    if(data.session){currentUser=data.session.user;showApp();}
    else{$('#setup-screen').style.display='none';$('#auth-screen').classList.add('active');}
  }catch(e){toast('Chyba pripojenia: '+e.message,'error');}
}

// ═══ AUTH ═══
$$('.auth-tab').forEach(t=>t.onclick=()=>{
  $$('.auth-tab').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  $$('.auth-form').forEach(f=>f.classList.remove('active'));
  $(`#${t.dataset.auth}-form`).classList.add('active');
});
$('#login-form').onsubmit=async e=>{
  e.preventDefault();
  const email=$('#login-email').value.trim(),pw=$('#login-password').value;
  try{
    const{data,error}=await sb.auth.signInWithPassword({email,password:pw});
    if(error)throw error;
    currentUser=data.user;showApp();
  }catch(e){toast(e.message,'error');}
};
$('#register-form').onsubmit=async e=>{
  e.preventDefault();
  const email=$('#reg-email').value.trim(),pw=$('#reg-password').value,pw2=$('#reg-password2').value;
  if(pw!==pw2)return toast('Heslá sa nezhodujú','error');
  if(pw.length<6)return toast('Heslo musí mať min. 6 znakov','error');
  try{
    const{data,error}=await sb.auth.signUp({email,password:pw});
    if(error)throw error;
    if(data.user){currentUser=data.user;showApp();toast('Účet vytvorený!','success');}
    else toast('Skontroluj email pre potvrdenie','info');
  }catch(e){toast(e.message,'error');}
};
$('#logout-btn').onclick=async()=>{await sb.auth.signOut();location.reload();};

// ═══ SHOW APP ═══
async function showApp(){
  $('#setup-screen').style.display='none';
  $('#auth-screen').classList.remove('active');
  $('#app-container').classList.add('active');
  $('#user-email').textContent=currentUser.email;
  isAdmin=currentUser.email===ADMIN_EMAIL;
  if(isAdmin){$('#admin-badge').classList.remove('hidden');$('#admin-tab').classList.remove('hidden');}
  await ensureTables();
  await loadGoals();
  setDate(new Date());
  loadLibrary();
}

// ═══ DB INIT ═══
async function ensureTables(){
  // Check if foods table has data, if not seed it
  const{data}=await sb.from('foods').select('id').limit(1);
  if(!data||data.length===0){
    for(const f of DEFAULT_FOODS){
      await sb.from('foods').insert({...f,user_id:currentUser.id,is_global:true});
    }
  }
}

// ═══ DATE NAV ═══
function setDate(d){
  selectedDate=new Date(d);
  $('#date-picker').value=dateStr(selectedDate);
  $('#date-display').textContent=fmtDate(selectedDate);
  loadDiary();
}
$('#date-prev').onclick=()=>{selectedDate.setDate(selectedDate.getDate()-1);setDate(selectedDate);};
$('#date-next').onclick=()=>{selectedDate.setDate(selectedDate.getDate()+1);setDate(selectedDate);};
$('#date-picker').onchange=e=>setDate(new Date(e.target.value));

// ═══ NAV TABS ═══
$$('.nav-tab').forEach(t=>t.onclick=()=>{
  $$('.nav-tab').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  $$('.tab-content').forEach(c=>c.classList.remove('active'));
  $(`#tab-${t.dataset.tab}`).classList.add('active');
  if(t.dataset.tab==='library')loadLibrary();
  if(t.dataset.tab==='admin'&&isAdmin)loadAdmin();
});

// ═══ GOALS ═══
async function loadGoals(){
  const{data}=await sb.from('goals').select('*').eq('user_id',currentUser.id).limit(1);
  if(data&&data.length>0){
    goals=data[0];
    $('#goal-kcal').value=goals.kcal;
    $('#goal-protein').value=goals.protein;
    $('#goal-carbs').value=goals.carbs;
    $('#goal-fat').value=goals.fat;
  }
}
$('#goals-form').onsubmit=async e=>{
  e.preventDefault();
  const g={kcal:+$('#goal-kcal').value,protein:+$('#goal-protein').value,carbs:+$('#goal-carbs').value,fat:+$('#goal-fat').value,user_id:currentUser.id};
  const{data:ex}=await sb.from('goals').select('id').eq('user_id',currentUser.id).limit(1);
  if(ex&&ex.length>0)await sb.from('goals').update(g).eq('id',ex[0].id);
  else await sb.from('goals').insert(g);
  goals=g;toast('Ciele uložené!','success');loadDiary();
};

// ═══ DIARY ═══
async function loadDiary(){
  const day=dateStr(selectedDate);
  const{data:entries}=await sb.from('diary_entries').select('*').eq('user_id',currentUser.id).eq('date',day);
  renderSummary(entries||[]);
  renderMeals(entries||[]);
}
function renderSummary(entries){
  const totals={kcal:0,protein:0,carbs:0,fat:0};
  entries.forEach(e=>{totals.kcal+=e.kcal;totals.protein+=e.protein;totals.carbs+=e.carbs;totals.fat+=e.fat;});
  const items=[
    {label:'Kalórie',value:Math.round(totals.kcal),goal:goals.kcal,unit:'kcal',color:'#6c5ce7'},
    {label:'Bielkoviny',value:totals.protein.toFixed(1),goal:goals.protein,unit:'g',color:'#00b894'},
    {label:'Sacharidy',value:totals.carbs.toFixed(1),goal:goals.carbs,unit:'g',color:'#fdcb6e'},
    {label:'Tuky',value:totals.fat.toFixed(1),goal:goals.fat,unit:'g',color:'#e17055'}
  ];
  $('#daily-summary').innerHTML=items.map(i=>{
    const pct=Math.min((parseFloat(i.value)/i.goal)*100,100);
    const circ=2*Math.PI*38;
    const offset=circ-(pct/100)*circ;
    return `<div class="macro-ring-card">
      <div class="ring-container">
        <svg viewBox="0 0 90 90"><circle class="ring-bg" cx="45" cy="45" r="38"/><circle class="ring-progress" cx="45" cy="45" r="38" stroke="${i.color}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/></svg>
        <div class="ring-value">${i.value}<small>${i.unit}</small></div>
      </div>
      <div class="macro-label">${i.label}</div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px">z ${i.goal} ${i.unit}</div>
    </div>`;
  }).join('');
}
function renderMeals(entries){
  $('#meals-container').innerHTML=MEALS.map(m=>{
    const items=entries.filter(e=>e.meal===m.id);
    const mkcal=items.reduce((s,e)=>s+e.kcal,0);
    return `<div class="meal-section">
      <div class="meal-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
        <div class="meal-header-left"><span class="meal-emoji">${m.emoji}</span><span class="meal-name">${m.name}</span></div>
        <span class="meal-kcal">${Math.round(mkcal)} kcal</span>
      </div>
      <div class="meal-items">
        ${items.map(i=>`<div class="meal-item">
          <div><div class="meal-item-name">${i.food_name}</div><div style="font-size:0.72rem;color:var(--text-muted)">${i.amount}${i.unit||'g'}</div></div>
          <div class="meal-item-info">
            <span class="meal-item-kcal">${Math.round(i.kcal)} kcal</span>
            <span>B:${i.protein.toFixed(1)}</span><span>S:${i.carbs.toFixed(1)}</span><span>T:${i.fat.toFixed(1)}</span>
            <button class="meal-item-delete" onclick="deleteEntry('${i.id}')">✕</button>
          </div>
        </div>`).join('')}
        <div class="meal-item" style="justify-content:center">
          <button class="btn btn-ghost btn-sm" onclick="openLibraryForMeal('${m.id}')">+ Pridať jedlo</button>
        </div>
      </div>
    </div>`;
  }).join('');
}
async function deleteEntry(id){
  await sb.from('diary_entries').delete().eq('id',id);
  toast('Odstránené','success');loadDiary();
}
function openLibraryForMeal(mealId){
  $('#modal-meal').value=mealId;
  $$('.nav-tab').forEach(x=>x.classList.remove('active'));
  $$('.nav-tab')[1].classList.add('active');
  $$('.tab-content').forEach(c=>c.classList.remove('active'));
  $('#tab-library').classList.add('active');
  loadLibrary();
}

// ═══ FOOD LIBRARY ═══
let allFoods=[];
async function loadLibrary(){
  const{data}=await sb.from('foods').select('*').order('name');
  allFoods=data||[];
  renderFoods(allFoods);
}
function renderFoods(foods){
  $('#food-grid').innerHTML=foods.length?foods.map(f=>`<div class="food-card" onclick='openAddModal(${JSON.stringify(f).replace(/'/g,"&#39;")})'>
    <div class="food-card-name">${f.name}</div>
    <div class="food-card-brand">${f.brand||'Bez značky'}</div>
    <div class="food-card-macros">
      <span class="food-macro kcal">${Math.round(f.kcal)} kcal</span>
      <span class="food-macro protein">B:${f.protein}g</span>
      <span class="food-macro carbs">S:${f.carbs}g</span>
      <span class="food-macro fat">T:${f.fat}g</span>
    </div>
    <div class="food-card-per">na ${f.serving_size}${f.unit}</div>
  </div>`).join(''):'<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px">Žiadne jedlá. Pridaj vlastný produkt!</p>';
}
$('#library-search').oninput=e=>{
  const q=e.target.value.toLowerCase();
  renderFoods(allFoods.filter(f=>(f.name+' '+f.brand+' '+f.category).toLowerCase().includes(q)));
};

// ═══ ADD FOOD MODAL ═══
function openAddModal(food){
  modalFood=food;
  $('#modal-food-info').innerHTML=`<p style="font-weight:700;margin-bottom:4px">${food.name}</p><p style="font-size:0.8rem;color:var(--text-muted)">Základ: ${food.serving_size}${food.unit} = ${food.kcal} kcal</p>`;
  $('#modal-amount').value=food.serving_size;
  updateModalPreview();
  $('#add-food-modal').classList.add('active');
}
function updateModalPreview(){
  if(!modalFood)return;
  const amt=+$('#modal-amount').value||0;
  const r=amt/modalFood.serving_size;
  $('#modal-calc-preview').innerHTML=`<div style="display:flex;justify-content:space-around;text-align:center;font-size:0.85rem">
    <div><div style="font-weight:700;color:var(--accent-light)">${Math.round(modalFood.kcal*r)}</div><div style="font-size:0.7rem;color:var(--text-muted)">kcal</div></div>
    <div><div style="font-weight:700;color:var(--green)">${(modalFood.protein*r).toFixed(1)}</div><div style="font-size:0.7rem;color:var(--text-muted)">bielk.</div></div>
    <div><div style="font-weight:700;color:var(--orange)">${(modalFood.carbs*r).toFixed(1)}</div><div style="font-size:0.7rem;color:var(--text-muted)">sach.</div></div>
    <div><div style="font-weight:700;color:var(--red)">${(modalFood.fat*r).toFixed(1)}</div><div style="font-size:0.7rem;color:var(--text-muted)">tuky</div></div>
  </div>`;
}
$('#modal-amount').oninput=updateModalPreview;
$('#modal-cancel').onclick=()=>$('#add-food-modal').classList.remove('active');
$('#modal-confirm').onclick=async()=>{
  if(!modalFood)return;
  const amt=+$('#modal-amount').value;
  const r=amt/modalFood.serving_size;
  const entry={
    user_id:currentUser.id,date:dateStr(selectedDate),meal:$('#modal-meal').value,
    food_name:modalFood.name,food_id:modalFood.id,amount:amt,unit:modalFood.unit,
    kcal:modalFood.kcal*r,protein:modalFood.protein*r,carbs:modalFood.carbs*r,fat:modalFood.fat*r
  };
  const{error}=await sb.from('diary_entries').insert(entry);
  if(error){toast(error.message,'error');return;}
  $('#add-food-modal').classList.remove('active');
  toast('Pridané do denníka!','success');
  // Switch to diary
  $$('.nav-tab').forEach(x=>x.classList.remove('active'));
  $$('.nav-tab')[0].classList.add('active');
  $$('.tab-content').forEach(c=>c.classList.remove('active'));
  $('#tab-diary').classList.add('active');
  loadDiary();
};

// ═══ CUSTOM FOOD ═══
$('#custom-food-form').onsubmit=async e=>{
  e.preventDefault();
  const food={
    name:$('#cf-name').value.trim(),brand:$('#cf-brand').value.trim(),
    category:$('#cf-category').value,serving_size:+$('#cf-serving').value,unit:$('#cf-unit').value,
    kcal:+$('#cf-kcal').value,protein:+$('#cf-protein').value,carbs:+$('#cf-carbs').value,fat:+$('#cf-fat').value,
    fiber:+$('#cf-fiber').value||0,sugar:+$('#cf-sugar').value||0,salt:+$('#cf-salt').value||0,
    user_id:currentUser.id,is_global:isAdmin
  };
  const{error}=await sb.from('foods').insert(food);
  if(error){toast(error.message,'error');return;}
  toast('Produkt uložený!','success');
  $('#custom-food-form').reset();$('#cf-serving').value=100;
};

// ═══ ADMIN ═══
async function loadAdmin(){
  if(!isAdmin)return;
  // Users (from diary entries)
  const{data:entries}=await sb.from('diary_entries').select('user_id,date');
  const users={};(entries||[]).forEach(e=>{if(!users[e.user_id])users[e.user_id]={id:e.user_id,entries:0};users[e.user_id].entries++;});
  $('#admin-users-list').innerHTML=`<table class="data-table"><thead><tr><th>User ID</th><th>Záznamy</th></tr></thead><tbody>${Object.values(users).map(u=>`<tr><td style="font-size:0.75rem">${u.id}</td><td>${u.entries}</td></tr>`).join('')}</tbody></table>`;
  // Foods
  const{data:foods}=await sb.from('foods').select('*').order('name');
  $('#admin-foods-list').innerHTML=`<table class="data-table"><thead><tr><th>Názov</th><th>Kcal</th><th>B</th><th>S</th><th>T</th><th>Akcia</th></tr></thead><tbody>${(foods||[]).map(f=>`<tr><td>${f.name}</td><td>${f.kcal}</td><td>${f.protein}</td><td>${f.carbs}</td><td>${f.fat}</td><td><button class="btn btn-danger btn-sm" onclick="adminDeleteFood('${f.id}')">🗑️</button></td></tr>`).join('')}</tbody></table>`;
  // All entries
  const{data:allE}=await sb.from('diary_entries').select('*').order('date',{ascending:false}).limit(100);
  $('#admin-entries-list').innerHTML=`<table class="data-table"><thead><tr><th>Dátum</th><th>Jedlo</th><th>Produkt</th><th>Kcal</th><th>User</th></tr></thead><tbody>${(allE||[]).map(e=>`<tr><td>${e.date}</td><td>${e.meal}</td><td>${e.food_name}</td><td>${Math.round(e.kcal)}</td><td style="font-size:0.7rem">${e.user_id.slice(0,8)}...</td></tr>`).join('')}</tbody></table>`;
}
async function adminDeleteFood(id){
  if(!confirm('Naozaj zmazať?'))return;
  await sb.from('foods').delete().eq('id',id);
  toast('Jedlo zmazané','success');loadAdmin();
}

// Close modal on overlay click
$('#add-food-modal').onclick=e=>{if(e.target.id==='add-food-modal')$('#add-food-modal').classList.remove('active');};
