// ======================= script.js (نهائي ومتكامل) =======================

// ✅ نظام تسجيل الدخول المحلي (محفوظ في localStorage)
const users = JSON.parse(localStorage.getItem("users") || "{}");
let currentUser = localStorage.getItem("currentUser") || null;

// عناصر DOM
const authSection = document.getElementById("auth");
const mainSection = document.getElementById("main");
const btnLogin = document.getElementById("btnLogin");
const btnRegister = document.getElementById("btnRegister");
const btnLogout = document.getElementById("btnLogout");
const btnAccount = document.getElementById("btnAccount");
const accModal = document.getElementById("accountModal");
const closeAcc = document.getElementById("closeAcc");
const deleteAcc = document.getElementById("deleteAcc");
const accName = document.getElementById("accName");
const accCreated = document.getElementById("accCreated");
const togglePw = document.getElementById("togglePw");

const foodInput = document.getElementById("foodInput");
const btnSearch = document.getElementById("btnSearch");
const suggestions = document.getElementById("suggestions");
const foodResult = document.getElementById("foodResult");

// -------------------- مساعدة: SHA-256 لتخزين آمن لكلمات المرور --------------------
async function hash(text) {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// -------------------- تسجيل الدخول / إنشاء حساب / تسجيل خروج --------------------
btnLogin.addEventListener("click", async () => {
  const u = document.getElementById("auth-username").value.trim();
  const p = document.getElementById("auth-password").value.trim();
  if (!u || !p) return alert("الرجاء إدخال اسم المستخدم وكلمة المرور");
  const hashed = await hash(p);
  if (!users[u] || users[u].password !== hashed)
    return alert("اسم المستخدم أو كلمة المرور غير صحيحة");
  currentUser = u;
  localStorage.setItem("currentUser", u);
  showMain();
});

btnRegister.addEventListener("click", async () => {
  const u = document.getElementById("auth-username").value.trim();
  const p = document.getElementById("auth-password").value.trim();
  if (!u || !p) return alert("أدخل اسم المستخدم وكلمة المرور");
  if (users[u]) return alert("هذا الاسم مستخدم بالفعل");
  const hashed = await hash(p);
  users[u] = { password: hashed, created: new Date().toLocaleString() };
  localStorage.setItem("users", JSON.stringify(users));
  alert("تم إنشاء الحساب بنجاح ✅");
});

btnLogout.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  currentUser = null;
  showAuth();
});

function showMain() {
  authSection.classList.add("hidden");
  mainSection.classList.remove("hidden");
  document.getElementById("welcome").innerText = `مرحبًا، ${currentUser || ""}`;
}
function showAuth() {
  authSection.classList.remove("hidden");
  mainSection.classList.add("hidden");
}
if (currentUser) showMain();

// -------------------- زر إظهار/إخفاء كلمة المرور --------------------
if (togglePw) {
  togglePw.addEventListener("click", () => {
    const pw = document.getElementById("auth-password");
    if (!pw) return;
    pw.type = pw.type === "password" ? "text" : "password";
  });
}

// -------------------- نافذة الحساب (عرض / حذف) --------------------
if (btnAccount) {
  btnAccount.addEventListener("click", () => {
    if (!currentUser) return alert("يجب تسجيل الدخول أولاً");
    accName.innerText = currentUser;
    accCreated.innerText = users[currentUser]?.created || "غير معروف";
    accModal.classList.remove("hidden");
  });
}
if (closeAcc) closeAcc.addEventListener("click", () => accModal.classList.add("hidden"));
if (deleteAcc) {
  deleteAcc.addEventListener("click", () => {
    if (!currentUser) return;
    if (!confirm("هل أنت متأكد أنك تريد حذف حسابك؟ لا يمكن التراجع عن ذلك.")) return;
    delete users[currentUser];
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.removeItem("currentUser");
    currentUser = null;
    accModal.classList.add("hidden");
    showAuth();
    alert("تم حذف الحساب.");
  });
}

// -------------------- BMI + الوزن المثالي + نصائح + تفريغ --------------------
document.getElementById("btnCalcBMI").addEventListener("click", () => {
  const h = parseFloat(document.getElementById("height").value);
  const w = parseFloat(document.getElementById("weight").value);
  const resultDiv = document.getElementById("bmiResult");
  if (!h || !w) return (resultDiv.innerHTML = "⚠️ الرجاء إدخال الطول والوزن");

  const bmi = (w / (h * h)).toFixed(1);
  let status = "";
  if (bmi < 18.5) status = "نقص في الوزن";
  else if (bmi < 25) status = "وزن مثالي";
  else if (bmi < 30) status = "زيادة بسيطة في الوزن";
  else status = "سمنة";

  const minIdeal = 18.5 * h * h;
  const maxIdeal = 24.9 * h * h;
  const avgIdeal = ((minIdeal + maxIdeal) / 2).toFixed(1);
  const diff = (w - avgIdeal).toFixed(1);
  const diffText =
    diff > 0
      ? `🔻 تحتاج لخسارة ${diff} كجم للوصول إلى الوزن المثالي`
      : diff < 0
      ? `🔺 تحتاج لزيادة ${Math.abs(diff)} كجم للوصول إلى الوزن المثالي`
      : `✅ وزنك مثالي تمامًا`;

  const calories = bmi < 18.5 ? 2800 : bmi < 25 ? 2300 : bmi < 30 ? 1900 : 1600;
  const advice =
    bmi < 18.5
      ? "تناول أطعمة غنية بالبروتين والسعرات مثل الأرز والمكسرات واللحوم"
      : bmi < 25
      ? "استمر بنظامك المتوازن الحالي"
      : bmi < 30
      ? "قلل الدهون والسكريات وركز على الخضروات والبروتينات"
      : "ابدأ حمية منخفضة السعرات ونشاط يومي منتظم";

  const table = `
  <table border="1" style="width:100%;margin-top:10px;border-collapse:collapse">
    <tr><th>النشاط</th><th>المدة</th><th>السعرات المحروقة (تقريبًا)</th></tr>
    <tr><td>المشي السريع</td><td>30 دقيقة</td><td>150</td></tr>
    <tr><td>الركض</td><td>30 دقيقة</td><td>300</td></tr>
    <tr><td>تمارين مقاومة خفيفة</td><td>30 دقيقة</td><td>200</td></tr>
    <tr><td>ركوب الدراجة</td><td>30 دقيقة</td><td>250</td></tr>
  </table>`;

  resultDiv.innerHTML = `
    🔹 <strong>مؤشر كتلة الجسم (BMI):</strong> ${bmi}<br>
    🔹 <strong>الحالة:</strong> ${status}<br>
    🔹 <strong>الوزن المثالي:</strong> من ${minIdeal.toFixed(1)} إلى ${maxIdeal.toFixed(1)} كجم (المتوسط ${avgIdeal} كجم)<br>
    ${diffText}<br>
    🔹 <strong>السعرات اليومية الموصى بها:</strong> ${calories} سعرة حرارية<br>
    🔹 <strong>نصيحة غذائية:</strong> ${advice}<br><br>
    <strong>🧭 جدول نشاط بدني مقترح:</strong><br>${table}
  `;
});

document.getElementById("btnResetBMI").addEventListener("click", () => {
  document.getElementById("height").value = "";
  document.getElementById("weight").value = "";
  document.getElementById("bmiResult").innerHTML = "";
});

// -------------------- قاعدة بيانات محلية احتياطية --------------------
const localFoods = {
  "بيض": { calories: 155, protein: 13, fat: 11, carbs: 1.1, fiber: 0, sugar: 1.1 },
  "تفاح": { calories: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4, sugar: 10 },
  "لبن": { calories: 42, protein: 3.4, fat: 1, carbs: 5, fiber: 0, sugar: 5 },
  "رز": { calories: 130, protein: 2.7, fat: 0.3, carbs: 28, fiber: 0.4, sugar: 0 },
  "عيش": { calories: 265, protein: 9, fat: 3.2, carbs: 49, fiber: 2.4, sugar: 5 },
  "فراخ": { calories: 239, protein: 27, fat: 14, carbs: 0, fiber: 0, sugar: 0 },
};

// -------------------- أدوات مساعده: debounce و safe get --------------------
function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
function gv(obj, path, fallback = null) {
  try {
    return path.split(".").reduce((a, b) => (a ? a[b] : undefined), obj) ?? fallback;
  } catch {
    return fallback;
  }
}

// -------------------- اقتراحات أثناء الكتابة (suggestions) --------------------
foodInput.addEventListener("input", debounce(async () => {
  const q = foodInput.value.trim();
  suggestions.innerHTML = "";
  if (!q) { suggestions.classList.add("hidden"); return; }

  // محاولة سريعة لجلب اقتراحات من OpenFoodFacts (خيار اختياري)
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=8&fields=product_name,brands,code,image_small_url`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("failed");
    const d = await r.json();
    const products = d.products || [];
    if (products.length) {
      products.slice(0, 8).forEach(p => {
        const el = document.createElement("div");
        const name = p.product_name || "منتج غير مسمى";
        const brand = p.brands ? ` — ${p.brands}` : "";
        el.innerText = `${name}${brand}`;
        el.addEventListener("click", () => {
          foodInput.value = p.product_name || "";
          suggestions.classList.add("hidden");
          displayProductByCode(p.code).catch(()=>searchFood()); // نحاول جلب التفاصيل بكود المنتج
        });
        suggestions.appendChild(el);
      });
      suggestions.classList.remove("hidden");
      return;
    }
  } catch {
    // لو فشل، نعرض اقتراحات محلية
    const keys = Object.keys(localFoods).filter(k => k.includes(q) || k.includes(q.toLowerCase()));
    if (keys.length) {
      keys.slice(0,8).forEach(k => {
        const el = document.createElement("div");
        el.innerText = k;
        el.addEventListener("click", () => {
          foodInput.value = k;
          suggestions.classList.add("hidden");
          searchFood();
        });
        suggestions.appendChild(el);
      });
      suggestions.classList.remove("hidden");
      return;
    }
  }

  suggestions.classList.add("hidden");
}, 300));

// إخفاء الاقتراحات عند النقر خارج
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-box") && !e.target.closest(".suggestions")) {
    suggestions.classList.add("hidden");
  }
});

// -------------------- دالة لعرض تفاصيل منتج عبر barcode (إذا توفر) --------------------
async function displayProductByCode(code) {
  if (!code) return searchFood();
  foodResult.innerHTML = "⏳ جلب تفاصيل المنتج...";
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`);
    if (!r.ok) throw new Error("no product");
    const j = await r.json();
    if (j.status !== 1) throw new Error("not found");
    const p = j.product;
    renderProduct(p);
  } catch {
    // فشل، اذهب للبحث العام
    searchFood();
  }
}

// -------------------- البحث الفعلي (searchFood) --------------------
btnSearch.addEventListener("click", searchFood);
foodInput.addEventListener("keyup", e => { if (e.key === "Enter") searchFood(); });

async function searchFood() {
  const query = foodInput.value.trim();
  if (!query) return (foodResult.innerHTML = "⚠️ الرجاء كتابة اسم الطعام.");

  foodResult.innerHTML = "🔍 جاري البحث...";
  suggestions.classList.add("hidden");

  // نجرب OpenFoodFacts أولًا
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=1&fields=product_name,brands,image_url,code,nutriments,ingredients_text,allergens,serving_size,countries,nutriscore_grade`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("شبكة");
    const data = await res.json();
    if (data.products && data.products.length > 0) {
      const p = data.products[0];
      renderProduct(p);
      return;
    } else {
      throw new Error("لا نتائج");
    }
  } catch (err) {
    // لو فشل الاتصال أو لا توجد نتائج، نبحث في القاعدة المحلية
    const local = localFoods[query] || localFoods[query.toLowerCase()];
    if (local) {
      foodResult.innerHTML = `
        <div class="card">
          <h3>${query}</h3>
          <table style="width:100%;border-collapse:collapse;margin-top:8px">
            <tr><td style="text-align:right;padding:6px">السعرات ( لكل 100غ )</td><td style="padding:6px">${local.calories}</td></tr>
            <tr><td style="text-align:right;padding:6px">بروتين</td><td style="padding:6px">${local.protein} جم</td></tr>
            <tr><td style="text-align:right;padding:6px">دهون</td><td style="padding:6px">${local.fat} جم</td></tr>
            <tr><td style="text-align:right;padding:6px">كربوهيدرات</td><td style="padding:6px">${local.carbs} جم</td></tr>
            <tr><td style="text-align:right;padding:6px">ألياف</td><td style="padding:6px">${local.fiber} جم</td></tr>
            <tr><td style="text-align:right;padding:6px">سكريات</td><td style="padding:6px">${local.sugar} جم</td></tr>
          </table>
          <div class="muted small" style="margin-top:8px">مصدر: بيانات محلية احتياطية</div>
        </div>
      `;
      return;
    }

    // إذا لا توجد بيانات محلية أيضاً
    foodResult.innerHTML = `❌ لم تُعثر أي نتائج على OpenFoodFacts للعنصر "${query}". حاول كلمة أخرى (مثال: 'بيض' أو 'egg').`;
  }
}

// -------------------- دالة عرض منتج مفصلة --------------------
function renderProduct(p) {
  const name = p.product_name || p.product_name_en || p.product_name_ar || "اسم غير متاح";
  const brand = p.brands || "غير محدد";
  const image = p.image_url || p.image_small_url || "";
  const ingredients = p.ingredients_text || "غير متوفر";
  const allergens = p.allergens || p.allergens_from_ingredients || "غير مذكور";
  const serving = p.serving_size || "غير متوفر";
  const countries = p.countries || "";
  const nutri = p.nutriscore_grade || "غير مصنف";
  const code = p.code || p._id || "غير متوفر";

  // صفوف القيم الغذائية
  const rows = [];
  const add = (label, key) => {
    const v100 = gv(p, `nutriments.${key}_100g`);
    const vserv = gv(p, `nutriments.${key}_serving`);
    if (v100 == null && vserv == null) return;
    let text = "";
    if (v100 != null) text += `${v100} لكل 100غ`;
    if (vserv != null) text += (text ? " — " : "") + `${vserv} للحصة`;
    rows.push(`<tr><td style="text-align:right;padding:6px">${label}</td><td style="padding:6px">${text}</td></tr>`);
  };

  add("السعرات (kcal)", "energy-kcal");
  add("طاقة (kJ)", "energy");
  add("الدهون (g)", "fat");
  add("دهون مشبعة (g)", "saturated-fat");
  add("كربوهيدرات (g)", "carbohydrates");
  add("سكريات (g)", "sugars");
  add("ألياف (g)", "fiber");
  add("بروتين (g)", "proteins");
  add("ملح (g)", "salt");
  add("صوديوم (g)", "sodium");

  const nutritionHtml = rows.length ? rows.join("") : `<tr><td class="muted small">لا توجد معلومات غذائية متاحة.</td></tr>`;

  foodResult.innerHTML = `
    <div class="card">
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <div style="flex:1;text-align:right">
          <h3 style="margin:6px 0">${name}</h3>
          <div class="muted small">${brand}${countries ? " — " + countries : ""}</div>
        </div>
        <div style="width:120px">
          ${image ? `<img src="${image}" alt="${name}" style="width:100%;border-radius:8px">` : `<div class="muted small" style="padding:10px;border-radius:8px;background:#f4f4f4;text-align:center">لا صورة</div>`}
        </div>
      </div>

      <div style="margin-top:10px">
        <strong>المكونات:</strong> <span class="muted small">${ingredients}</span><br>
        <strong>مسببات الحساسية:</strong> <span class="muted small">${allergens}</span><br>
        <strong>حجم الحصة:</strong> <span class="muted small">${serving}</span><br>
        <strong>NutriScore:</strong> <span class="muted small">${nutri}</span><br>
        <strong>Barcode:</strong> <span class="muted small">${code}</span><br><br>
      </div>

      <div>
        <strong>القيم الغذائية المتاحة:</strong>
        <table style="width:100%;border-collapse:collapse;margin-top:8px">
          <tbody>
            ${nutritionHtml}
          </tbody>
        </table>
      </div>

      <div class="muted small" style="margin-top:8px">
        مصدر البيانات: OpenFoodFacts — قد تختلف الدقة حسب إدخال المنتج.
      </div>
    </div>
  `;
  foodResult.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ============================================================================

