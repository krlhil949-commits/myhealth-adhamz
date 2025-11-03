// ================= helper UI functions =================
function showSection(id){ document.querySelectorAll('.section').forEach(s=>s.classList.add('hidden')); document.getElementById(id).classList.remove('hidden'); }

// ==== تسجيل بسيط كما سابقا ====
function register(){ const u=document.getElementById('username').value.trim(), p=document.getElementById('password').value.trim(); if(!u||!p) return alert('ادخل اسم وكلمة مرور'); localStorage.setItem(u,p); alert('تم إنشاء الحساب'); }
function login(){ const u=document.getElementById('username').value.trim(), p=document.getElementById('password').value.trim(); if(localStorage.getItem(u)===p){ alert('مرحباً '+u); showSection('bmi'); } else alert('بيانات غير صحيحة'); }

// ===== BMI بسيط =====
function calculateBMI(){ const w=parseFloat(document.getElementById('weight').value), h=parseFloat(document.getElementById('height').value); if(!w||!h) return alert('أدخل وزن وطول صحيحين'); const bmi=(w/(h*h)).toFixed(2); document.getElementById('bmiResult').innerHTML=`مؤشر كتلة جسمك: <b>${bmi}</b>`; }

// =========== IndexedDB setup ===========
const DB_NAME = 'FoodDB_v1';
const DB_STORE = 'foods';
let db = null;
let fuse = null;
let fuseList = [];

// Initialize DB
function initDB(){
  return new Promise((resolve,reject)=>{
    const req = indexedDB.open(DB_NAME,1);
    req.onupgradeneeded = e => {
      const idb = e.target.result;
      if(!idb.objectStoreNames.contains(DB_STORE)){
        const store = idb.createObjectStore(DB_STORE,{ keyPath:'id', autoIncrement:true });
        store.createIndex('name','name',{unique:false});
      }
    };
    req.onsuccess = e => { db = e.target.result; resolve(); };
    req.onerror = e => reject(e);
  });
}

// bulk insert small batch
function bulkInsert(items){
  return new Promise((resolve,reject)=>{
    if(!db) return reject('DB not initialized');
    const tx = db.transaction(DB_STORE,'readwrite');
    const store = tx.objectStore(DB_STORE);
    for(const it of items) store.add(it);
    tx.oncomplete = ()=> resolve();
    tx.onerror = e => reject(e);
  });
}

// count items
function countItems(){
  return new Promise(resolve=>{
    const tx = db.transaction(DB_STORE,'readonly');
    const store = tx.objectStore(DB_STORE);
    const req = store.count();
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> resolve(0);
  });
}

// load names into fuse index (only id + name)
function loadNamesToIndex(limit=1000000){
  return new Promise((resolve,reject)=>{
    if(!db) return reject('DB not initialized');
    fuseList = [];
    const tx = db.transaction(DB_STORE,'readonly');
    const store = tx.objectStore(DB_STORE);
    const cursorReq = store.openCursor();
    let loaded = 0;
    cursorReq.onsuccess = e => {
      const cursor = e.target.result;
      if(cursor && loaded < limit){
        const rec = cursor.value;
        fuseList.push({ id: rec.id, name: rec.name });
        loaded++;
        cursor.continue();
      } else {
        // create Fuse
        const options = { keys:['name'], threshold:0.35, ignoreLocation:true, includeScore:true };
        fuse = new Fuse(fuseList, options);
        resolve(loaded);
      }
    };
    cursorReq.onerror = e => reject(e);
  });
}

// get record by id
function getFoodById(id){
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(DB_STORE,'readonly');
    const store = tx.objectStore(DB_STORE);
    const req = store.get(Number(id));
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e);
  });
}

// =========== UI import dialog ===========
function showImportDialog(){ document.getElementById('importArea').classList.remove('hidden'); }
function hideImportDialog(){ document.getElementById('importArea').classList.add('hidden'); }

// import from local JSON file (chunk)
async function importFromFile(){
  const f = document.getElementById('fileInput').files[0];
  if(!f) return alert('اختر ملف JSON');
  document.getElementById('status').innerText = 'يتم قراءة الملف...';
  const txt = await f.text();
  let arr;
  try { arr = JSON.parse(txt); if(!Array.isArray(arr)) throw 'not array'; }
  catch(e){ return alert('ملف غير صالح: يجب أن يكون JSON مصفوفة'); }

  // insert in small batches to keep UI responsive
  const BATCH = 1000;
  for(let i=0;i<arr.length;i+=BATCH){
    const batch = arr.slice(i,i+BATCH);
    await bulkInsert(batch);
    document.getElementById('status').innerText = `تم إدخال ${Math.min(i+BATCH,arr.length)}/${arr.length}`;
    await new Promise(r=>setTimeout(r,30));
  }
  document.getElementById('status').innerText = 'انتهى الاستيراد — جاري بناء فهرس الأسماء...';
  await loadNamesToIndex();
  document.getElementById('status').innerText = 'جاهز. الفهرس مُحدّث.';
  hideImportDialog();
}

// clear DB
function clearDatabase(){
  if(!confirm('هل تريد مسح قاعدة البيانات بالكامل؟')) return;
  const req = indexedDB.deleteDatabase(DB_NAME);
  req.onsuccess = ()=> { alert('تم المسح. أعِد تحميل الصفحة.'); location.reload(); };
  req.onerror = ()=> alert('فشل المسح');
}

// =========== Local fuzzy search (Fuse) ===========
async function performSearch(){
  const q = document.getElementById('foodInput').value.trim();
  const suggestionsDiv = document.getElementById('suggestions');
  const resultDiv = document.getElementById('foodResult');
  suggestionsDiv.innerHTML = '';
  resultDiv.innerHTML = '';
  if(!q) return alert('اكتب كلمة للبحث');

  // ensure index ready
  if(!fuse) { document.getElementById('status').innerText='جارٍ بناء الفهرس...'; await loadNamesToIndex(); document.getElementById('status').innerText=''; }

  const results = fuse.search(q, { limit: 10 });
  if(results.length === 0){ suggestionsDiv.innerHTML = '<p>لا توجد نتائج محلية. جرّب البحث عبر Open Food Facts.</p>'; return; }

  // show buttons
  results.forEach(r=>{
    const b = document.createElement('button');
    b.textContent = r.item.name;
    b.onclick = ()=> showFoodById(r.item.id);
    suggestionsDiv.appendChild(b);
  });
  // show top
  showFoodById(results[0].item.id);
}

// show food by id (fetch details and display)
async function showFoodById(id){
  const rec = await getFoodById(id);
  if(!rec) return;
  displayFood(rec);
}

function displayFood(rec){
  const container = document.getElementById('foodResult');
  let inputHtml = '';
  if(rec.type === 'unit'){
    inputHtml = `<label>العدد</label><input id="amountInput" type="number" min="1" value="1" oninput="updateDisplayedFood(${rec.id})"/> <span>${rec.unitName||'وحدة'}</span>`;
  } else if(rec.type === 'drink'){
    inputHtml = `<label>مل</label><input id="amountInput" type="number" min="1" value="250" oninput="updateDisplayedFood(${rec.id})"/> <span>مل</span>`;
  } else {
    inputHtml = `<label>جم</label><input id="amountInput" type="number" min="1" value="100" oninput="updateDisplayedFood(${rec.id})"/> <span>جم</span>`;
  }
  container.innerHTML = `<h3>${rec.name}</h3><div>${inputHtml}</div><div id="nutrition_${rec.id}"></div><div style="color:#ffd">${rec.notes||''}</div>`;
  updateDisplayedFood(rec.id);
}

async function updateDisplayedFood(id){
  const rec = await getFoodById(id);
  if(!rec) return;
  const amount = parseFloat(document.getElementById('amountInput')?.value || 100);
  let factor = (rec.type === 'unit') ? amount : amount / 100;
  const calories = (rec.calories * factor).toFixed(1);
  const protein = (rec.protein * factor).toFixed(2);
  const fat = (rec.fat * factor).toFixed(2);
  const carbs = (rec.carbs * factor).toFixed(2);

  document.getElementById(`nutrition_${id}`).innerHTML = `<ul style="text-align:right; list-style:none;padding:0">
    <li>الكمية: <b>${amount} ${rec.type==='unit'?rec.unitName:(rec.type==='weight'?'جم':'مل')}</b></li>
    <li>السعرات: <b>${calories}</b></li>
    <li>البروتين: <b>${protein} جم</b></li>
    <li>الدهون: <b>${fat} جم</b></li>
    <li>الكربوهيدرات: <b>${carbs} جم</b></li>
  </ul>`;
}

// =========== Live search via Open Food Facts API (online fallback) ===========
async function searchOpenFoodFactsAPI(q, page=1, pageSize=10){
  // API v2 search endpoint (returns JSON) — documented in OFF docs.
  const url = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(q)}&page_size=${pageSize}&page=${page}&fields=product_name,nutriments,brands,code,quantity`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('OFF API failed: '+res.status);
  return res.json();
}

async function searchOpenFoodFacts(){
  const q = document.getElementById('foodInput').value.trim();
  if(!q) return alert('اكتب اسم للبحث');
  document.getElementById('status').innerText = 'جاري البحث عبر Open Food Facts (الإنترنت)...';
  try {
    const data = await searchOpenFoodFactsAPI(q,1,10);
    document.getElementById('status').innerText = '';
    const list = data?.products || [];
    if(list.length === 0) return alert('لا توجد نتائج على Open Food Facts');
    // عرض أول 8 نتائج مع زر لإضافة إلى DB محليًا
    const suggestionsDiv = document.getElementById('suggestions'); suggestionsDiv.innerHTML='';
    const resultDiv = document.getElementById('foodResult'); resultDiv.innerHTML='';
    list.slice(0,8).forEach(p=>{
      const name = p.product_name || (p.brands||p.code) || 'غير معروف';
      const btn = document.createElement('button'); btn.textContent = name;
      btn.onclick = ()=> showOFFProductDetails(p);
      suggestionsDiv.appendChild(btn);
    });
    // عرض أول نتيجة
    showOFFProductDetails(list[0]);
  } catch(err){
    console.error(err);
    document.getElementById('status').innerText = 'فشل الاتصال بـ OFF';
    alert('خطأ في جلب البيانات من Open Food Facts: ' + err.message);
  }
}

// عرض تفاصيل منتج من Open Food Facts
function showOFFProductDetails(p){
  const container = document.getElementById('foodResult');
  const nutr = p.nutriments || {};
  // حاول استخراج قيم لكل 100g أو per serving إذا متاحة
  const cal100 = nutr['energy-kcal_100g'] ?? nutr['energy-kcal'] ?? nutr['energy_100g'] ?? 0;
  const protein100 = nutr['proteins_100g'] ?? nutr['proteins'] ?? 0;
  const fat100 = nutr['fat_100g'] ?? nutr['fat'] ?? 0;
  const carbs100 = nutr['carbohydrates_100g'] ?? nutr['carbohydrates'] ?? 0;
  const quantity = p.quantity || '100g';
  container.innerHTML = `<h3>${p.product_name || 'غير معروف'}</h3>
    <p>الكمية الظاهرة في المصدر: ${quantity}</p>
    <div>
      <label>جرام</label><input id="amountInput" type="number" value="100" oninput="updateOFFDisplay(${cal100},${protein100},${fat100},${carbs100})"/>
    </div>
    <div id="offNutrition"></div>
    <button onclick='saveOFFToDB(${JSON.stringify({name:p.product_name||'unknown', calories:cal100, protein:protein100, fat:fat100, carbs:carbs100, type:"weight", unitName:"جرام", notes:"مصدر: Open Food Facts"})})'>حفظ هذا المنتج في القاعدة المحلية</button>
  `;
  updateOFFDisplay(cal100,protein100,fat100,carbs100);
}

// تحديث عرض values من OFF
function updateOFFDisplay(cal,prot,fat,carb){
  const amount = parseFloat(document.getElementById('amountInput')?.value || 100);
  const factor = amount / 100;
  document.getElementById('offNutrition').innerHTML = `<ul style="text-align:right;list-style:none;padding:0">
    <li>الكمية: <b>${amount} جم</b></li>
    <li>السعرات: <b>${(cal*factor).toFixed(1)}</b></li>
    <li>البروتين: <b>${(prot*factor).toFixed(2)} جم</b></li>
    <li>الدهون: <b>${(fat*factor).toFixed(2)} جم</b></li>
    <li>الكربوهيدرات: <b>${(carb*factor).toFixed(2)} جم</b></li>
  </ul>`;
}

// حفظ منتج OFF في DB محلي (بعد التحقق)
async function saveOFFToDB(obj){
  // obj جاهز للحفظ بصيغة: { name, calories, protein, fat, carbs, type, unitName, notes }
  await bulkInsert([obj]);
  document.getElementById('status').innerText = 'تم الحفظ محليًا. أعد بناء الفهرس...';
  await loadNamesToIndex();
  document.getElementById('status').innerText = 'جاهز';
  alert('تم حفظ المنتج محليًا');
}

// helper escape & init
function escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// =========== boot ===========
(async function(){
  await initDB();
  const c = await countItems();
  if(c===0){
    // نضيف أمثلة قليلة لتجربة محلية فورية (يمكن حذفها)
    const sample = [
      { name:'بيض', calories:70, protein:6, fat:5, carbs:0.6, type:'unit', unitName:'بيضة', notes:'حجم متوسط' },
      { name:'أرز أبيض', calories:130, protein:2.7, fat:0.3, carbs:28, type:'weight', unitName:'جرام' },
      { name:'ماء', calories:0, protein:0, fat:0, carbs:0, type:'drink', unitName:'مل' }
    ];
    await bulkInsert(sample);
  }
  await loadNamesToIndex();
  // dynamic unit suggestion: عند إدخال اسم حاول مطابقة تام لإظهار وحدة الإدخال
  document.getElementById('foodInput').addEventListener('input', async ()=>{
    const name = document.getElementById('foodInput').value.trim();
    const uc = document.getElementById('unitContainer');
    uc.innerHTML='';
    if(!name) return;
    if(!fuse) await loadNamesToIndex();
    const r = fuse.search('^'+name, { limit:1, useExtendedSearch:true });
    if(r.length>0){
      const rec = await getFoodById(r[0].item.id);
      if(rec){
        if(rec.type==='unit') uc.innerHTML=`<input id="foodAmount" type="number" value="1"/><span>${rec.unitName}</span>`;
        else if(rec.type==='drink') uc.innerHTML=`<input id="foodAmount" type="number" value="250"/><span>مل</span>`;
        else uc.innerHTML=`<input id="foodAmount" type="number" value="100"/><span>جم</span>`;
      }
    }
  });
})();
