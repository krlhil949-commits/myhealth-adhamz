// ✅ نظام تسجيل الدخول المحلي
const users = JSON.parse(localStorage.getItem("users") || "{}");
let currentUser = localStorage.getItem("currentUser") || null;

const authSection = document.getElementById("auth");
const mainSection = document.getElementById("main");
const btnLogin = document.getElementById("btnLogin");
const btnRegister = document.getElementById("btnRegister");
const btnLogout = document.getElementById("btnLogout");

// 🔒 تشفير كلمة المرور
async function hash(text) {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// 🔑 تسجيل الدخول
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

// 🧾 إنشاء حساب
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

// 🚪 تسجيل الخروج
btnLogout.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  currentUser = null;
  showAuth();
});

// 🧍 عرض واجهات
function showMain() {
  authSection.classList.add("hidden");
  mainSection.classList.remove("hidden");
  document.getElementById("welcome").innerText = `مرحبًا، ${currentUser}`;
}
function showAuth() {
  authSection.classList.remove("hidden");
  mainSection.classList.add("hidden");
}
if (currentUser) showMain();

// 🧮 حساب BMI + الوزن المثالي + النشاط
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

  resultDiv.innerHTML = `
  <b>BMI:</b> ${bmi} (${status})<br>
  🔹 الوزن المثالي: ${minIdeal.toFixed(1)} - ${maxIdeal.toFixed(1)} كجم (المتوسط ${avgIdeal} كجم)<br>
  ${diffText}<br>
  🔹 السعرات الموصى بها: ${calories} سعرة/يوم<br>
  🔹 نصيحة: ${advice}
  `;
});

document.getElementById("btnResetBMI").addEventListener("click", () => {
  document.getElementById("height").value = "";
  document.getElementById("weight").value = "";
  document.getElementById("bmiResult").innerHTML = "";
});

// 🍎 قاعدة بيانات غذائية محلية
const localFoods = {
  "بيض": { calories: 155, protein: 13, fat: 11, carbs: 1.1, fiber: 0, sugar: 1.1 },
  "تفاح": { calories: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4, sugar: 10 },
  "لبن": { calories: 42, protein: 3.4, fat: 1, carbs: 5, fiber: 0, sugar: 5 },
  "رز": { calories: 130, protein: 2.7, fat: 0.3, carbs: 28, fiber: 0.4, sugar: 0 },
  "عيش": { calories: 265, protein: 9, fat: 3.2, carbs: 49, fiber: 2.4, sugar: 5 },
  "فراخ": { calories: 239, protein: 27, fat: 14, carbs: 0, fiber: 0, sugar: 0 },
};

// 🥗 محرك البحث الغذائي الذكي
document.getElementById("btnSearchFood").addEventListener("click", searchFood);
document
  .getElementById("foodInput")
  .addEventListener("keyup", e => e.key === "Enter" && searchFood());

async function searchFood() {
  const query = document.getElementById("foodInput").value.trim();
  const foodResult = document.getElementById("foodResult");
  if (!query) return (foodResult.innerHTML = "⚠️ الرجاء كتابة اسم الطعام.");

  foodResult.innerHTML = "🔍 جاري البحث...";

  // أولًا نحاول من الإنترنت
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/search?fields=product_name,nutriments&limit=1&search_terms=${encodeURIComponent(
        query
      )}`
    );
    if (!res.ok) throw new Error("فشل الاتصال");
    const data = await res.json();
    if (!data.products?.length) throw new Error("لا توجد نتائج");

    const p = data.products[0];
    const n = p.nutriments || {};

    foodResult.innerHTML = `
      ✅ <b>${p.product_name || query}</b><br>
      🔹 السعرات: ${n["energy-kcal_100g"] || "غير متوفر"} /100g<br>
      🔹 البروتين: ${n.proteins_100g || "غير متوفر"} جم<br>
      🔹 الدهون: ${n.fat_100g || "غير متوفر"} جم<br>
      🔹 الكربوهيدرات: ${n.carbohydrates_100g || "غير متوفر"} جم<br>
      🔹 الألياف: ${n.fiber_100g || "غير متوفر"} جم<br>
      🔹 السكر: ${n.sugars_100g || "غير متوفر"} جم<br>
      🔹 الملح: ${n.salt_100g || "غير متوفر"} جم
    `;
  } catch (err) {
    // إن فشل البحث، نستخدم البيانات المحلية
    const item = localFoods[query];
    if (item) {
      foodResult.innerHTML = `
        ✅ <b>${query}</b><br>
        🔹 السعرات: ${item.calories} /100g<br>
        🔹 البروتين: ${item.protein} جم<br>
        🔹 الدهون: ${item.fat} جم<br>
        🔹 الكربوهيدرات: ${item.carbs} جم<br>
        🔹 الألياف: ${item.fiber} جم<br>
        🔹 السكر: ${item.sugar} جم
      `;
    } else {
      foodResult.innerHTML = "❌ لم يتم العثور على نتائج، حاول كتابة الاسم بالعربية أو الإنجليزية.";
    }
  }
}
