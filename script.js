/***********************
  script.js
  متكامل: BMI + محرك غذائي ضخم (IndexedDB + Fuse.js + OFF API)
************************/

/* ----------------- واجهة الأقسام ----------------- */
function showSection(id){
  document.querySelectorAll(".section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

/* ----------------- تسجيل بسيط ----------------- */
function register(){
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!username || !password) return alert("يرجى إدخال اسم المستخدم وكلمة المرور");
  localStorage.setItem(username, password);
  alert("تم إنشاء الحساب بنجاح!");
}
function login(){
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (localStorage.getItem(username) === password) {
    alert(`مرحباً ${username}!`);
    showSection('bmi');
  } else {
    alert("بيانات الدخول غير صحيحة");
  }
}

/* ----------------- BMI + BMR + نصائح + جداول ----------------- */
function calculateBMIFull(){
  const weight = parseFloat(document.getElementById("weight").value);
  const height = parseFloat(document.getElementById("height").value);
  const age = parseInt(document.getElementById("age").value) || 25;
  const gender = document.getElementById("gender").value || "male";

  if (!weight || !height) {
    alert("يرجى إدخال الوزن والطول بشكل صحيح");
    return;
  }

  const bmi = (weight / (height * height));
  const bmiRounded = bmi.toFixed(2);

  // BMR (Mifflin-St Jeor)
  let bmr;
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * (height * 100) - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * (height * 100) - 5 * age - 161;
  }
  const maintenanceCalories = Math.round(bmr * 1.55); // نشاط معتدل
  const gainCalories = Math.round(maintenanceCalories * 1.15);
  const lossCalories = Math.round(maintenanceCalories * 0.85);

  // نتيجة ومحتوى
  const resultDiv = document.getElementById("bmiResult");
  resultDiv.innerHTML = `
    <p>مؤشر كتلة جسمك (BMI): <strong>${bmiRounded}</strong></p>
    <p>السعرات اليومية للحفاظ على وزنك: <strong>${maintenanceCalories}</strong> سعرة حرارية</p>
    <p>لزيادة الوزن: <strong>${gainCalories}</strong> سعرة حرارية</p>
    <p>لإنقاص الوزن: <strong>${lossCalories}</strong> سعرة حرارية</p>
  `;

  // WHO table
  const whoTable = document.getElementById("whoTable");
  whoTable.innerHTML = `
    <h4>جدول منظمة الصحة العالمية</h4>
    <table style="width:100%; color:white;">
      <tr><th>الفئة</th><th>BMI</th></tr>
      <tr><td>نحيف</td><td>أقل من 18.5</td></tr>
      <tr><td>مثالي</td><td>18.5 - 24.9</td></tr>
      <tr><td>زيادة وزن</td><td>25 - 29.9</td></tr>
      <tr><td>سمنة</td><td>30 فأكثر</td></tr>
    </table>
  `;

  // نصائح مخصصة
  const adviceList = document.getElementById("adviceList");
  adviceList.innerHTML = "";
  let message = "";
  if (bmi < 18.5) {
    message = "وزنك أقل من الطبيعي، تحتاج لزيادة السعرات تدريجياً.";
    adviceList.innerHTML = `
      <li>زد عدد الوجبات إلى 4-5 يومياً.</li>
      <li>تناول بروتينات كاملة (بيض، دجاج، لبن، لحوم قليلة الدهن).</li>
      <li>مارس تمارين المقاومة ونام جيدًا.</li>
    `;
  } else if (bmi >= 18.5 && bmi <= 24.9) {
    message = "وزنك مثالي، حافظ على توازنك الغذائي.";
    adviceList.innerHTML = `
      <li>استمر في النشاط البدني المعتدل.</li>
      <li>التنوع في مصادر البروتين والكربوهيدرات والدهون الصحية.</li>
    `;
  } else {
    message = "وزنك أعلى من الطبيعي، قلل السعرات وزد النشاط.";
    adviceList.innerHTML = `
      <li>مارس المشي 30 دقيقة يومياً على الأقل.</li>
      <li>قلل السكريات والدهون المشبعة وزد الخضار.</li>
    `;
  }

  document.getElementById("adviceSection").classList.remove("hidden");

  // جدول حرق السعرات
  const burnTable = document.getElementById("burnTable");
  burnTable.innerHTML = `
    <h4>كيفية حرق السعرات</h4>
    <table style="width:100%; color:white;">
      <tr><th>النشاط</th><th>30 دقيقة</th><th>60 دقيقة</th></tr>
      <tr><td>المشي السريع</td><td>150 سعرة</td><td>300 سعرة</td></tr>
      <tr><td>الجري المتوسط</td><td>300 سعرة</td><td>600 سعرة</td></tr>
      <tr><td>ركوب الدراجة</td><td>250 سعرة</td><td>500 سعرة</td></tr>
      <tr><td>تمارين المقاومة</td><td>200 سعرة</td><td>400 سعرة</td></tr>
    </table>
    <p style="margin-top:8px;color:#ffd">${message}</p>
  `;
}

/* ----------------- قاعدة بيانات غذائية محلية (IndexedDB) + Fuse.js ----------------- */

/* إعدادات DB/Fuse */
const DB_NAME = 'FoodDB_v1';
const DB_STORE = 'foods';
let db = null;
let fuse = null;
let fuseList = [];

/* تهيئة IndexedDB */
function initDB(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (ev) => {
      const idb = ev.target.result;
      if (!idb.objectStoreNames.contains(DB_STORE)) {
        const store = idb.createObjectStore(DB_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('name', 'name', { unique: false });
      }
    };
    req.onsuccess = (ev) => { db = ev.target.result; resolve(); };
    req.onerror = (ev) => { reject(ev); };
  });
}

/* إدخال دفعة (bulk) */
function bulkInsert(items){
  return new Promise((resolve, reject) => {
    if (!db) return reject('DB not initialized');
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    for (const it of items) store.add(it);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e);
  });
}

/* مسح DB */
function clearDatabase(){
  if (!confirm('هل تريد مسح قاعدة البيانات المحلية بالكامل؟')) return;
  const req = indexedDB.deleteDatabase(DB_NAME);
  req.onsuccess = () => { alert('تم المسح. أعد تحميل الصفحة.'); location.reload(); };
  req.onerror = () => alert('فشل المسح');
}

/* عد عدد السجلات */
function countItems(){
  return new Promise(resolve => {
    const tx = db.transaction(DB_STORE,'readonly');
    const store = tx.objectStore(DB_STORE);
    const req = store.count();
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> resolve(0);
  });
}

/* تحميل الأسماء لبناء فهرس Fuse.js (خفيف في الذاكرة: id + name) */
function loadNamesToIndex(limit = 1000000){
  return new Promise((resolve, reject) => {
    if (!db) return reject('DB not initialized');
    fuseList = [];
    const tx = db.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const req = store.openCursor();
    let loaded = 0;
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor && loaded < limit) {
        const rec = cursor.value;
        fuseList.push({ id: rec.id, name: rec.name });
        loaded++;
        cursor.continue();
      } else {
        const options = {
          keys: ['name'],
          includeScore: true,
          threshold: 0.35,
          ignoreLocation: true,
          useExtendedSearch: true
        };
        fuse = new Fuse(fuseList, options);
        resolve(loaded);
      }
    };
    req.onerror = (err) => reject(err);
  });
}

/* جلب سجل كامل من DB بحسب id */
function getFoodById(id){
  return new Promise((resolve,reject) => {
    const tx = db.transaction(DB_STORE,'readonly');
    const store = tx.objectStore(DB_STORE);
    const req = store.get(Number(id));
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e);
  });
}

/* ----------------- استيراد من ملف JSON (chunk) ----------------- */
function showImportDialog(){ document.getElementById('importArea').classList.remove('hidden'); }
function hideImportDialog(){ document.getElementById('importArea').classList.add('hidden'); }

async function importFromFile(){
  const f = document.getElementById('fileInput').files[0];
  if (!f) return alert('اختر ملف JSON');
  document.getElementById('status').innerText = 'جارٍ قراءة الملف...';
  const txt = await f.text();
  let arr;
  try { arr = JSON.parse(txt); if (!Array.isArray(arr)) throw 'not array'; }
  catch (e) { return alert('ملف غير صالح: يجب أن يكون JSON مصفوفة'); }

  const BATCH = 1000; // دفعات لتفادي تعليق الواجهة
  for (let i = 0; i < arr.length; i += BATCH) {
    const batch = arr.slice(i, i + BATCH);
    await bulkInsert(batch);
    document.getElementById('status').innerText = `تم إدخال ${Math.min(i + BATCH, arr.length)}/${arr.length}`;
    await new Promise(r => setTimeout(r, 30));
  }
  document.getElementById('status').innerText = 'انتهى الاستيراد — جاري بناء الفهرس...';
  await loadNamesToIndex();
  document.getElementById('status').innerText = 'جاهز. الفهرس مُحدّث.';
  hideImportDialog();
}

/* ----------------- بحث محلي ذكي (Fuse) ----------------- */
async function performSearch(){
  const q = document.getElementById('foodInput').value.trim();
  const suggestionsDiv = document.getElementById('suggestions');
  suggestionsDiv.innerHTML = '';
  document.getElementById('foodResult').innerHTML = '';
  if (!q) return alert('اكتب اسمًا للبحث');

  if (!fuse) {
    document.getElementById('status').innerText = 'جاري تحميل الفهرس...';
    await loadNamesToIndex();
    document.getElementById('status').innerText = '';
  }

  const results = fuse.search(q, { limit: 12 });
  if (results.length === 0) {
    suggestionsDiv.innerHTML = `<p>لا توجد نتائج محلية. جرّب البحث عبر الإنترنت.</p>`;
    return;
  }

  results.forEach(r => {
    const btn = document.createElement('button');
    btn.textContent = r.item.name;
    btn.onclick = () => showFoodById(r.item.id);
    suggestionsDiv.appendChild(btn);
  });

  // عرض أول نتيجة تلقائياً
  showFoodById(results[0].item.id);
}

/* عرض تفاصيل سجل */
async function showFoodById(id){
  const rec = await getFoodById(id);
  if (!rec) return;
  displayFood(rec);
}

/* عرض طعام في DOM مع وحدة مناسبة */
function displayFood(rec){
  const container = document.getElementById('foodResult');
  let inputHtml = '';
  if (rec.type === 'unit') {
    inputHtml = `<label>العدد:</label> <input id="amountInput" type="number" min="1" value="1" oninput="updateDisplayedFood(${rec.id})"> <span>${rec.unitName || 'وحدة'}</span>`;
  } else if (rec.type === 'drink') {
    inputHtml = `<label>الكمية (مل):</label> <input id="amountInput" type="number" min="1" value="250" oninput="updateDisplayedFood(${rec.id})"> <span>مل</span>`;
  } else {
    inputHtml = `<label>الوزن (جم):</label> <input id="amountInput" type="number" min="1" value="100" oninput="updateDisplayedFood(${rec.id})"> <span>جم</span>`;
  }

  container.innerHTML = `
    <h3>${escapeHtml(rec.name)}</h3>
    <p>${rec.category ? escapeHtml(rec.category) : ''}</p>
    <div>${inputHtml}</div>
    <div id="nutrition_${rec.id}" style="margin-top:10px;"></div>
    <div style="margin-top:8px; font-size:0.9em; color:#ffd">${rec.notes ? escapeHtml(rec.notes) : ''}</div>
  `;
  updateDisplayedFood(rec.id);
}

/* تحديث الحسابات عند تغيير الكمية */
async function updateDisplayedFood(id){
  const rec = await getFoodById(id);
  if (!rec) return;
  const amount = parseFloat(document.getElementById('amountInput')?.value || 100);
  let factor;
  if (rec.type === 'unit') factor = amount; // كل سجل يمثل وحدة واحدة مثلاً بيضة = 1
  else factor = amount / 100; // القيم مخزنة لكل 100 جرام/مل

  const calories = (rec.calories * factor).toFixed(1);
  const protein = (rec.protein * factor).toFixed(2);
  const fat = (rec.fat * factor).toFixed(2);
  const carbs = (rec.carbs * factor).toFixed(2);

  document.getElementById(`nutrition_${id}`).innerHTML = `
    <ul style="text-align:right; list-style:none; padding:0;">
      <li>الكمية: <b>${amount} ${rec.type === 'unit' ? (rec.unitName || '') : (rec.type === 'weight' ? 'جم' : 'مل')}</b></li>
      <li>السعرات: <b>${calories}</b> سعرة</li>
      <li>البروتين: <b>${protein}</b> جم</li>
      <li>الدهون: <b>${fat}</b> جم</li>
      <li>الكربوهيدرات: <b>${carbs}</b> جم</li>
    </ul>
  `;
}

/* ----------------- بحث مباشر عبر Open Food Facts (إنترنت) ----------------- */
async function searchOpenFoodFactsAPI(q, page = 1, pageSize = 12){
  const url = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(q)}&page_size=${pageSize}&page=${page}&fields=product_name,nutriments,brands,code,quantity`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('فشل الاتصال بقاعدة Open Food Facts');
  return res.json();
}

async function searchOpenFoodFacts(){
  const q = document.getElementById('foodInput').value.trim();
  if (!q) return alert('اكتب اسمًا للبحث');
  document.getElementById('status').innerText = 'جارٍ البحث عبر Open Food Facts...';
  try {
    const data = await searchOpenFoodFactsAPI(q, 1, 10);
    document.getElementById('status').innerText = '';
    const products = data.products || [];
    if (products.length === 0) return alert('لا توجد نتائج على Open Food Facts');

    const suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.innerHTML = '';
    products.slice(0, 8).forEach(p => {
      const name = p.product_name || (p.brands || p.code) || 'غير معروف';
      const btn = document.createElement('button');
      btn.textContent = name;
      btn.onclick = () => showOFFProductDetails(p);
      suggestionsDiv.appendChild(btn);
    });
    showOFFProductDetails(products[0]);
  } catch (err) {
    console.error(err);
    document.getElementById('status').innerText = 'فشل الاتصال بالمصدر';
    alert('خطأ في جلب البيانات من Open Food Facts: ' + err.message);
  }
}

/* عرض تفاصيل منتج OFF */
function showOFFProductDetails(p){
  const container = document.getElementById('foodResult');
  const nutr = p.nutriments || {};
  const cal100 = nutr['energy-kcal_100g'] ?? nutr['energy_100g'] ?? nutr['energy-kcal'] ?? 0;
  const protein100 = nutr['proteins_100g'] ?? nutr['proteins'] ?? 0;
  const fat100 = nutr['fat_100g'] ?? nutr['fat'] ?? 0;
  const carbs100 = nutr['carbohydrates_100g'] ?? nutr['carbohydrates'] ?? 0;
  const quantity = p.quantity || '100g';
  container.innerHTML = `
    <h3>${p.product_name || 'غير معروف'}</h3>
    <p>الكمية الظاهرة في المصدر: ${quantity}</p>
    <div>
      <label>الكمية (جم)</label><input id="amountInput" type="number" value="100" oninput="updateOFFDisplay(${cal100},${protein100},${fat100},${carbs100})" />
    </div>
    <div id="offNutrition" style="margin-top:8px;"></div>
    <div style="margin-top:8px;">
      <button onclick='saveOFFToDB(${JSON.stringify({})})'>حفظ هذا المنتج في القاعدة المحلية</button>
    </div>
  `;
  // note: can't directly pass complex object via onclick easily; create handler:
  document.querySelector('#foodResult button').onclick = () => {
    const obj = {
      name: p.product_name || ('product-' + (p.code || Math.random())),
      calories: Number(cal100) || 0,
      protein: Number(protein100) || 0,
      fat: Number(fat100) || 0,
      carbs: Number(carbs100) || 0,
      type: 'weight',
      unitName: 'جم',
      notes: `مصدر: Open Food Facts - ${p.brands || ''}`
    };
    saveOFFToDB(obj);
  };
  updateOFFDisplay(cal100, protein100, fat100, carbs100);
}

function updateOFFDisplay(cal, prot, fat, carb){
  const amount = parseFloat(document.getElementById('amountInput')?.value || 100);
  const factor = amount / 100;
  document.getElementById('offNutrition').innerHTML = `
    <ul style="text-align:right; list-style:none; padding:0;">
      <li>الكمية: <b>${amount} جم</b></li>
      <li>السعرات: <b>${(cal * factor).toFixed(1)}</b></li>
      <li>البروتين: <b>${(prot * factor).toFixed(2)} جم</b></li>
      <li>الدهون: <b>${(fat * factor).toFixed(2)} جم</b></li>
      <li>الكربوهيدرات: <b>${(carb * factor).toFixed(2)} جم</b></li>
    </ul>
  `;
}

async function saveOFFToDB(obj){
  await bulkInsert([obj]);
  document.getElementById('status').innerText = 'تم الحفظ محلياً. أعِد بناء الفهرس...';
  await loadNamesToIndex();
  document.getElementById('status').innerText = 'جاهز';
  alert('تم حفظ المنتج في القاعدة المحلية');
}

/* ----------------- مساعدة وتجهيز مبدئي ----------------- */
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* عند التحميل: تهيئة DB، إضافة أمثلة إن كانت فارغة، وبناء فهرس الأسماء */
(async function boot(){
  await initDB();
  const c = await countItems();
  if (c === 0) {
    // أمثلة بسيطة لتجربة فورية
    const sample = [
      { name: 'بيض', calories: 70, protein: 6, fat: 5, carbs: 0.6, type: 'unit', unitName: 'بيضة', category: 'بروتين', notes: 'حجم متوسط' },
      { name: 'أرز أبيض', calories: 130, protein: 2.7, fat: 0.3, carbs: 28, type: 'weight', unitName: 'جم', category: 'نشويات' },
      { name: 'ماء', calories: 0, protein: 0, fat: 0, carbs: 0, type: 'drink', unitName: 'مل', category: 'مشروبات' },
      { name: 'دجاج مشوي', calories: 165, protein: 31, fat: 3.6, carbs: 0, type: 'weight', unitName: 'جم', category: 'لحوم' }
    ];
    await bulkInsert(sample);
  }
  await loadNamesToIndex();

  // عند إدخال اسم في الحقل حاول مطابقة تام لعرض الوحدة المناسبة
  document.getElementById('foodInput').addEventListener('input', async () => {
    const name = document.getElementById('foodInput').value.trim();
    const uc = document.getElementById('unitContainer');
    uc.innerHTML = '';
    if (!name) return;
    if (!fuse) await loadNamesToIndex();
    const r = fuse.search('^' + name, { limit: 1, useExtendedSearch: true });
    if (r.length > 0) {
      const rec = await getFoodById(r[0].item.id);
      if (rec) {
        if (rec.type === 'unit') uc.innerHTML = `<input id="foodAmount" type="number" value="1" min="1" /> <span>${rec.unitName}</span>`;
        else if (rec.type === 'drink') uc.innerHTML = `<input id="foodAmount" type="number" value="250" min="1" /> <span>مل</span>`;
        else uc.innerHTML = `<input id="foodAmount" type="number" value="100" min="1" /> <span>جم</span>`;
      }
    }
  });
})();
