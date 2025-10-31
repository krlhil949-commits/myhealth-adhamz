/* ============================================
  محرك غذائي مفتوح — يعتمد OpenFoodFacts + local cache
  - يدعم العربية بالترجمة (MyMemory)
  - يخبّئ النتائج في localStorage لتحسين السرعة
  - يحتفظ بقاعدة محلية احتياطية
  - تسجيل/تسجيل دخول بكلمة مرور مشفّرة (SHA-256)
============================================ */

/* ---------------- محلية: قائمة احتياطية صغيرة ---------------- */
const LOCAL_FOODS = [
  { name_ar: "تفاح", name_en: "apple", calories: 52, protein: 0.3, fat: 0.2, carbs: 14, sugar: 10, fiber: 2.4 },
  { name_ar: "موز", name_en: "banana", calories: 89, protein: 1.1, fat: 0.3, carbs: 23, sugar: 12, fiber: 2.6 },
  { name_ar: "بيض", name_en: "egg", calories: 155, protein: 13, fat: 11, carbs: 1.1, sugar: 1.1, fiber: 0 },
  { name_ar: "دجاج مشوي", name_en: "grilled chicken", calories: 239, protein: 27, fat: 14, carbs: 0, sugar: 0, fiber: 0 },
  { name_ar: "أرز أبيض مسلوق", name_en: "cooked white rice", calories: 130, protein: 2.7, fat: 0.3, carbs: 28, sugar: 0.1, fiber: 0.4 }
];

/* ---------------- عناصر DOM ---------------- */
const authSection = document.getElementById('auth');
const mainSection = document.getElementById('main');
const usernameInput = document.getElementById('auth-username');
const passwordInput = document.getElementById('auth-password');
const togglePwBtn = document.getElementById('togglePw');
const btnLogin = document.getElementById('btnLogin');
const btnRegister = document.getElementById('btnRegister');
const btnLogout = document.getElementById('btnLogout');
const welcome = document.getElementById('welcome');
const accModal = document.getElementById('accountModal');
const accName = document.getElementById('accName');
const accCreated = document.getElementById('accCreated');
const btnAccount = document.getElementById('btnAccount');
const closeAcc = document.getElementById('closeAcc');
const deleteAcc = document.getElementById('deleteAcc');

const heightEl = document.getElementById('height');
const weightEl = document.getElementById('weight');
const btnCalcBMI = document.getElementById('btnCalcBMI');
const btnResetBMI = document.getElementById('btnResetBMI');
const bmiResult = document.getElementById('bmiResult');

const foodInput = document.getElementById('foodInput');
const suggestions = document.getElementById('suggestions');
const btnSearch = document.getElementById('btnSearch');
const foodResult = document.getElementById('foodResult');

/* ---------------- تخزين المستخدم ---------------- */
const USERS_KEY = 'local_users_v2';
const CURRENT_KEY = 'current_user_v2';
const CACHE_KEY = 'food_cache_v1'; // cache للنتائج من الإنترنت

function saveUsers(obj) { localStorage.setItem(USERS_KEY, JSON.stringify(obj)); }
function loadUsers() { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); }
function setCurrent(username) { localStorage.setItem(CURRENT_KEY, username); }
function getCurrent() { return localStorage.getItem(CURRENT_KEY); }
function clearCurrent() { localStorage.removeItem(CURRENT_KEY); }

/* ---------------- SHA-256 لكلمات المرور ---------------- */
async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buf);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ---------------- واجهة المستخدم: auth ---------------- */
togglePwBtn.addEventListener('click', () => {
  passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
});

btnRegister.addEventListener('click', async () => {
  const u = usernameInput.value.trim();
  const p = passwordInput.value;
  if (!u || !p) return alert('الرجاء إدخال اسم المستخدم وكلمة المرور');
  const users = loadUsers();
  if (users[u]) return alert('هذا المستخدم موجود بالفعل. اختر اسمًا آخر.');
  const hash = await sha256(p);
  users[u] = { passwordHash: hash, created: new Date().toISOString() };
  saveUsers(users);
  setCurrent(u);
  showMain();
});
btnLogin.addEventListener('click', async () => {
  const u = usernameInput.value.trim();
  const p = passwordInput.value;
  if (!u || !p) return alert('الرجاء إدخال اسم المستخدم وكلمة المرور');
  const users = loadUsers();
  if (!users[u]) return alert('المستخدم غير موجود.');
  const hash = await sha256(p);
  if (hash === users[u].passwordHash) {
    setCurrent(u);
    showMain();
  } else {
    alert('كلمة المرور غير صحيحة.');
  }
});
btnLogout.addEventListener('click', () => {
  clearCurrent();
  showAuth();
});

/* ---------------- عرض الشاشات ---------------- */
function showAuth() {
  authSection.classList.remove('hidden');
  mainSection.classList.add('hidden');
  usernameInput.value = '';
  passwordInput.value = '';
}
function showMain() {
  authSection.classList.add('hidden');
  mainSection.classList.remove('hidden');
  const cur = getCurrent();
  welcome.innerText = `مرحبًا ${cur || 'ضيف'} 👋`;
}
if (getCurrent()) showMain();

/* ---------------- BMI ---------------- */

});// --- استبدال مستمع btnCalcBMI القديم بهذا المستمع الجديد ---
btnCalcBMI.removeEventListener?.('click', null); // محاولة نظيفة لإزالة أي مستمعات سابقة (آمنة)
btnCalcBMI.addEventListener('click', async () => {
  const h = parseFloat(heightEl.value);
  const w = parseFloat(weightEl.value);
  const age = parseInt(document.getElementById('age')?.value || '0', 10);
  const sex = document.getElementById('sex')?.value || 'male';
  const pal = parseFloat(document.getElementById('activity')?.value || '1.55');

  if (!h || !w || !age || age <= 0) return alert('أدخل الطول، الوزن، والعمر بشكل صحيح.');

  // حساب BMI
  const bmi = w / (h * h);
  // الوزن المثالي التقريبي على أساس BMI = 22
  const idealWeight = 22 * h * h;
  const diff = (w - idealWeight);

  // ====== حساب BMR (Mifflin-St Jeor) ======
  // Mifflin-St Jeor: BMR = 10*w(kg) + 6.25*h(cm) - 5*age + s  (s = +5 للذكور، -161 للإناث)
  const hCm = h * 100;
  const s = (sex === 'male') ? 5 : -161;
  const bmr = 10 * w + 6.25 * hCm - 5 * age + s; // kcal/day (تقريب)
  // TDEE = BMR * PAL (Physical Activity Level)
  const tdee = bmr * pal;

  // ====== توصيات زيادة/نقصان السعرات ======
  // قواعد عملية: عجز ~500 kcal/day => خسارة ~0.5 kg/week ، فائض ~300-500 => زيادة صحية
  let calRecommendation = '';
  let targetCalories = tdee;
  if (bmi < 18.5) {
    // نقص وزن => توصية بزيادة 300-500 kcal
    const add = 400;
    targetCalories = Math.round(tdee + add);
    calRecommendation = `نظراً لأن BMI = ${bmi.toFixed(1)} (نقص وزن)، نوصي بزيادة حوالي ${add} kcal/يوم فوق احتياجك (≈ ${targetCalories} kcal/يوم) لتحقيق زيادة وزن تدريجية وصحية.`;
  } else if (bmi >= 25) {
    // زيادة وزن => عجز 500 kcal
    const deficit = 500;
    targetCalories = Math.max(1200, Math.round(tdee - deficit)); // لا ننصح بمستويات خطيرة أقل من 1200
    calRecommendation = `نظراً لأن BMI = ${bmi.toFixed(1)} (وزن زائد)، نوصي بعجز تقريبي حوالي ${deficit} kcal/يوم (≈ ${targetCalories} kcal/يوم) لتحقيق خسارة مستدامة ~0.5 كجم/أسبوع.`;
  } else {
    calRecommendation = `BMI = ${bmi.toFixed(1)} — وزن ضمن النطاق الصحي. للحفاظ على وزنك راقب استهلاك ~${Math.round(tdee)} kcal/يوم.`;
  }

  // ====== توصية سكر (WHO) ======
  // WHO: أقل من 10% من مجمل الطاقة من السكّر الحر، والأفضل <5%
  const sugarLimit10g = ((tdee * 0.10) / 4).toFixed(1); // غرام سكر = (kcal_from_sugar)/4
  const sugarLimit5g  = ((tdee * 0.05) / 4).toFixed(1);
  const sugarMsg = `توصيات WHO: السكّر الحر ≤10% من الطاقة (≈ ${sugarLimit10g} g/يوم)، والأفضل <5% (≈ ${sugarLimit5g} g/يوم).`;

  // ====== أمثلة أطعمة يومية (تقريبية بالاعتماد على LOCAL_FOODS) ======
  // نعطي أمثلة بسيطة لتغطية فرق السعرات (إن نقص أو زيادة مطلوبة)
  const local = LOCAL_FOODS;
  // نعرض 3 اقتراحات: خفيفة، متوسطة، عالية — نستخدم قيم kcal من local (تم افتراض أنها لكل 100g)
  function sampleFoodPlans(deltaCalories) {
    // deltaCalories: رقم موجبي = نحتاج إضافة / سالبي = نحتاج نقص
    const plans = [];
    // نسهل: نستخدم التفاح (52 kcal/100g) وبيض (155 kcal/100g) وأرز (130 kcal/100g) وموز (89)
    const apple = local.find(x=>x.name_en==='apple') || local[0];
    const egg   = local.find(x=>x.name_en==='egg') || local[2];
    const rice  = local.find(x=>x.name_en==='cooked white rice') || local[4];
    const banana= local.find(x=>x.name_en==='banana') || local[1];
    // تحويل kcal/100g إلى جرام مطلوب لتغطية delta
    const items = [
      {name: apple.name_ar, kcalPer100: apple.calories},
      {name: egg.name_ar,   kcalPer100: egg.calories},
      {name: rice.name_ar,  kcalPer100: rice.calories},
      {name: banana.name_ar,kcalPer100: banana.calories}
    ];
    for (const it of items) {
      if (!it.kcalPer100 || it.kcalPer100 <= 0) continue;
      const grams = Math.round((Math.abs(deltaCalories) / it.kcalPer100) * 100);
      plans.push({food: it.name, grams, approxKcal: Math.round(it.kcalPer100 * grams / 100)});
    }
    return plans.slice(0,3);
  }

  const delta = Math.round(targetCalories - tdee);
  const foodPlan = (Math.abs(delta) > 50) ? sampleFoodPlans(delta) : [];

  // ====== جدول حرق السعرات حسب الأنشطة (معادلة MET) ======
  // حرق بالـ kcal/min = MET * 3.5 * weight_kg / 200
  const activities = [
    {name: 'مشي سريع (5 كم/س)', met: 3.8},
    {name: 'جري خفيف', met: 7.0},
    {name: 'ركوب دراجة معتدل', met: 6.8},
    {name: 'سباحة متوسطة', met: 6.0},
    {name: 'تمارين مقاومة (رفع أثقال)', met: 5.0}
  ];
  function calcBurn(met, minutes) {
    return (met * 3.5 * w / 200) * minutes;
  }
  const burnRows = activities.map(a => {
    const burn30 = Math.round(calcBurn(a.met, 30));
    const burn60 = Math.round(calcBurn(a.met, 60));
    return {activity: a.name, burn30, burn60};
  });

  // ====== بناء المحتوى لعرضه في واجهة المستخدم ======
  let html = `<div class="result">
    <h4 style="margin:0 0 6px 0">نتيجة BMI & احتياجات الطاقة</h4>
    <div class="muted small">BMI = ${bmi.toFixed(1)} — الوزن المثالي التقريبي ≈ ${idealWeight.toFixed(1)} كجم</div>
    <div style="margin-top:8px"><strong>BMR (راحة)</strong>: ${Math.round(bmr)} kcal/يوم — <strong>TDEE</strong>: ${Math.round(tdee)} kcal/يوم (مستوى نشاط PAL=${pal})</div>
    <div style="margin-top:8px">${escapeHtml(calRecommendation)}</div>
    <div style="margin-top:8px;color:var(--muted)">${escapeHtml(sugarMsg)}</div>`;

  if (foodPlan.length) {
    html += `<div style="margin-top:10px"><strong>خطة غذائية مقترحة لتعديل السعرات (${delta>=0? 'زيادة':'نقص'} ${Math.abs(delta)} kcal):</strong><ul>`;
    foodPlan.forEach(p => {
      html += `<li>${escapeHtml(p.food)} — ≈ ${p.grams} g (≈ ${p.approxKcal} kcal)</li>`;
    });
    html += `</ul></div>`;
  }

  // جدول الحرق
  html += `<div style="margin-top:12px"><strong>جدول تقديري لحرق السعرات (تعتمد القيم على وزنك الحالي ${w} كجم):</strong>
    <table style="width:100%;border-collapse:collapse;margin-top:8px">
      <thead><tr><th style="text-align:right;padding:6px">النشاط</th><th style="text-align:right;padding:6px">30 دقيقة (kcal)</th><th style="text-align:right;padding:6px">60 دقيقة (kcal)</th></tr></thead>
      <tbody>`;
  burnRows.forEach(r=>{
    html += `<tr><td style="text-align:right;padding:6px;border-top:1px solid #f0f0f0">${escapeHtml(r.activity)}</td>
             <td style="text-align:right;padding:6px;border-top:1px solid #f0f0f0">${r.burn30}</td>
             <td style="text-align:right;padding:6px;border-top:1px solid #f0f0f0">${r.burn60}</td></tr>`;
  });
  html += `</tbody></table></div>`;

  // إضافة المرجع/تنبيه
  html += `<div class="muted small" style="margin-top:10px">
    المصدر: الحسابات تقريبية ومبنية على معادلات علمية شائعة (Mifflin-St Jeor لحساب BMR، ومعاملات PAL وMET لاحتساب الإنفاق الطاقي). التوصيات الغذائية العامة مستندة إلى إرشادات منظمة الصحة العالمية (WHO) وFAO. هذه البيانات تعليمية وليست تشخيصاً — راجع اختصاصي تغذية/طبيب للخطط الشخصية.
  </div>`;

  html += `</div>`; // إغلاق .result

  foodResult.innerHTML = html;
});

btnResetBMI.addEventListener('click', () => {
  heightEl.value = '';
  weightEl.value = '';
  bmiResult.innerText = '';
});

/* ---------------- نافذة الحساب ---------------- */
btnAccount.addEventListener('click', () => {
  const cur = getCurrent();
  if (!cur) return alert('لا يوجد حساب حالي.');
  const users = loadUsers();
  const u = users[cur];
  accName.innerText = cur;
  accCreated.innerText = new Date(u.created).toLocaleString();
  accModal.classList.remove('hidden');
});
closeAcc.addEventListener('click', () => accModal.classList.add('hidden'));
deleteAcc.addEventListener('click', () => {
  if (!confirm('هل تريد حذف حسابك نهائيًا؟')) return;
  const cur = getCurrent();
  const users = loadUsers();
  delete users[cur];
  saveUsers(users);
  clearCurrent();
  accModal.classList.add('hidden');
  showAuth();
});

/* ---------------- مساعدة normalize ---------------- */
function normalize(s) {
  return (s||'').toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

/* ---------------- كاش للنتائج ---------------- */
function loadCache() {
  return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
}
function saveCache(cache) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

/* ---------------- ترجمة عربي → إنجليزي (MyMemory) ---------------- */
async function translateIfArabic(text) {
  const arabic = /[\u0600-\u06FF]/;
  if (!arabic.test(text)) return text;
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|en`;
    const r = await fetch(url);
    const j = await r.json();
    if (j.responseData && j.responseData.translatedText) {
      return j.responseData.translatedText;
    }
  } catch (e) {
    console.warn('ترجمة فشلت، سنستخدم النص كما هو', e);
  }
  return text;
}

/* ---------------- بحث على OpenFoodFacts ----------------
   endpoint: https://world.openfoodfacts.org/cgi/search.pl?search_terms=apple&search_simple=1&action=process&json=1
   نحاول استخراج nutriments من المنتج الأول إن وجد
-------------------------------------------------- */
async function fetchFromOpenFoodFacts(q) {
  const params = new URLSearchParams({
    search_terms: q,
    search_simple: 1,
    action: 'process',
    json: 1,
    page_size: 10
  });
  const url = `https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OpenFoodFacts fetch failed');
  const j = await res.json();
  if (!j.products || !j.products.length) return null;
  // نبحث عن أول منتج يحتوي على حقل nutriments
  const product = j.products.find(p => p.nutriments) || j.products[0];
  const n = product.nutriments || {};
  // نحاول قراءة قيم بالكيلوجرام أو 100g
  // OpenFoodFacts يستخدم مفاتيح مثل energy-kcal_100g, proteins_100g, fat_100g, carbohydrates_100g, sugars_100g, fiber_100g
  const calories = n['energy-kcal_100g'] ?? n['energy-kcal_serving'] ?? n['energy-kcal'] ?? null;
  const protein = n['proteins_100g'] ?? n['proteins_serving'] ?? n['proteins'] ?? null;
  const fat = n['fat_100g'] ?? n['fat_serving'] ?? n['fat'] ?? null;
  const carbs = n['carbohydrates_100g'] ?? n['carbohydrates_serving'] ?? n['carbohydrates'] ?? null;
  const sugar = n['sugars_100g'] ?? n['sugars_serving'] ?? n['sugars'] ?? null;
  const fiber = n['fiber_100g'] ?? n['fiber_serving'] ?? n['fiber'] ?? null;

  // اسم المنتج
  const name = product.product_name || product.name || product.brands || q;
  return {
    source: 'openfoodfacts',
    name,
    calories: isFinite(calories) ? Number(calories) : null,
    protein: isFinite(protein) ? Number(protein) : null,
    fat: isFinite(fat) ? Number(fat) : null,
    carbs: isFinite(carbs) ? Number(carbs) : null,
    sugar: isFinite(sugar) ? Number(sugar) : null,
    fiber: isFinite(fiber) ? Number(fiber) : null,
    raw: product
  };
}

/* ---------------- البحث الذكي الرئيسي ---------------- */
let suggTimer = null;
foodInput.addEventListener('input', () => {
  const q = foodInput.value.trim();
  if (suggTimer) clearTimeout(suggTimer);
  suggTimer = setTimeout(async () => {
    if (!q) { suggestions.classList.add('hidden'); suggestions.innerHTML = ''; return; }
    // اقتراحات سريعة: من local + من cache
    const local = LOCAL_FOODS.filter(it => normalize(it.name_ar).includes(normalize(q)) || normalize(it.name_en).includes(normalize(q)));
    const cache = loadCache();
    const cachedKeys = Object.keys(cache).filter(k => k.includes(normalize(q))).slice(0,5).map(k => cache[k]);
    const items = [...local.slice(0,6), ...cachedKeys.slice(0,6)].slice(0,8);
    if (!items.length) {
      suggestions.innerHTML = `<div class="muted">لا توجد اقتراحات سريعة — اضغط بحث للبحث عن الإنترنت</div>`;
      suggestions.classList.remove('hidden');
      return;
    }
    suggestions.innerHTML = items.map(it=>{
      if (it.name_ar) return `<div data-val="${escapeHtml(it.name_ar)}">${escapeHtml(it.name_ar)} — <span class="muted">${escapeHtml(it.name_en)}</span></div>`;
      // cache item (internet)
      return `<div data-val="${escapeHtml(it.query || it.name)}">${escapeHtml(it.name || it.query)} <span class="muted">(${escapeHtml(it.source)})</span></div>`;
    }).join('');
    suggestions.classList.remove('hidden');
    suggestions.querySelectorAll('div').forEach(div=>div.addEventListener('click', ()=>{
      const val = div.getAttribute('data-val');
      foodInput.value = val;
      suggestions.classList.add('hidden');
      doSearch(val);
    }));
  }, 180);
});

/* زر البحث */
btnSearch.addEventListener('click', () => {
  const q = foodInput.value.trim();
  if (!q) return alert('اكتب اسم الطعام.');
  doSearch(q);
});

/* تنفيذ البحث: ترجمة إذا لزم، تكوين مفتاح للكاش، محاولة OpenFoodFacts ثم الرجوع للـ local */
async function doSearch(query) {
  foodResult.innerHTML = `<div class="muted">🔎 جاري البحث عن "${escapeHtml(query)}" ...</div>`;
  try {
    const cache = loadCache();
    const key = normalize(query);
    if (cache[key]) {
      // استخدم الكاش إذا كان حديثًا (هنا سنة كافية كمثال)
      console.log('استخدام الكاش ل:', key);
      renderResult(cache[key], query);
      return;
    }

    // ترجمة إن لزم (إذا عربي)
    const translated = await translateIfArabic(query);
    const searchQuery = translated || query;

    // محاولة OpenFoodFacts
    let result = null;
    try {
      result = await fetchFromOpenFoodFacts(searchQuery);
    } catch (e) {
      console.warn('OpenFoodFacts failed', e);
    }

    if (result) {
      // خزّن في الكاش
      cache[key] = { ...result, query };
      saveCache(cache);
      renderResult(cache[key], query);
      return;
    }

    // fallback: بحث محلي
    const local = LOCAL_FOODS.find(it => normalize(it.name_ar) === normalize(query) || normalize(it.name_en) === normalize(query))
      || LOCAL_FOODS.find(it => normalize(it.name_ar).includes(normalize(query)) || normalize(it.name_en).includes(normalize(query)));

    if (local) {
      renderResult({ source: 'local', name: local.name_ar, ...local }, query);
      return;
    }

    // لم نجد شيء
    foodResult.innerHTML = `<div class="result muted">❌ لم يتم العثور على بيانات لـ "${escapeHtml(query)}". جرّب كلمة أخرى.</div>`;
  } catch (err) {
    console.error(err);
    foodResult.innerHTML = `<div class="result muted">⚠️ حدث خطأ أثناء البحث. تحقق من اتصال الإنترنت أو حاول مرة أخرى.</div>`;
  }
}

/* عرض النتيجة في واجهة جميلة */
function renderResult(obj, originalQuery) {
  const nameDisplay = obj.name || originalQuery;
  const calories = (obj.calories !== null && obj.calories !== undefined) ? formatNum(obj.calories) : '-';
  const protein  = (obj.protein  !== null && obj.protein  !== undefined) ? formatNum(obj.protein)  : '-';
  const fat      = (obj.fat      !== null && obj.fat      !== undefined) ? formatNum(obj.fat)      : '-';
  const carbs    = (obj.carbs    !== null && obj.carbs    !== undefined) ? formatNum(obj.carbs)    : '-';
  const sugar    = (obj.sugar    !== null && obj.sugar    !== undefined) ? formatNum(obj.sugar)    : '-';
  const fiber    = (obj.fiber    !== null && obj.fiber    !== undefined) ? formatNum(obj.fiber)    : '-';

  foodResult.innerHTML = `
    <div class="result">
      <h4 style="margin:0 0 6px 0">${escapeHtml(nameDisplay)} <span class="muted small">(${escapeHtml(obj.source || 'local')})</span></h4>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
        <div><strong>السعرات</strong><div class="muted">${calories} kcal (لكل 100g أو حسب المصدر)</div></div>
        <div><strong>بروتين</strong><div class="muted">${protein} g</div></div>
        <div><strong>دهون</strong><div class="muted">${fat} g</div></div>
        <div><strong>كربوهيدرات</strong><div class="muted">${carbs} g</div></div>
        <div><strong>سكر</strong><div class="muted">${sugar} g</div></div>
        <div><strong>ألياف</strong><div class="muted">${fiber} g</div></div>
      </div>
      <div class="muted small" style="margin-top:8px">مصدر البيانات: ${escapeHtml(obj.source || 'local')}</div>
    </div>
  `;
}

/* مساعدة تنسيقية */
function formatNum(v) {
  if (typeof v === 'number') {
    // إذا القيمة كبيرة جداً نفترض أنها لكل 100g عادةً لا نغيرها
    return Number(v).toFixed(1);
  }
  return v;
}
function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
}

/* إغلاق الاقتراحات عند النقر خارجها */
document.addEventListener('click', (e) => {
  if (!suggestions.contains(e.target) && e.target !== foodInput) {
    suggestions.classList.add('hidden');
  }
});


