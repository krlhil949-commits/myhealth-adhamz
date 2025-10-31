// ✅ نظام تسجيل الدخول المحلي
const users = JSON.parse(localStorage.getItem("users") || "{}");
let currentUser = localStorage.getItem("currentUser") || null;

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

// 🔒 دالة تشفير SHA-256
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

// 🧍عرض واجهة المستخدم
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

// 🧮 حساب الـ BMI والسعرات
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

  // 🔹 السعرات التقديرية (WHO formula المعدلة)
  let calories = 0;
  if (bmi < 18.5) calories = 2800;
  else if (bmi < 25) calories = 2300;
  else if (bmi < 30) calories = 1900;
  else calories = 1600;

  // 🔹 الحد الموصى به للسكر (WHO)
  const sugar = 50; // غرام يوميًا كحد أقصى

  // 🔹 توصية الطعام
  const foodAdvice =
    bmi < 18.5
      ? "تناول وجبات عالية البروتين والسعرات (مثل المكسرات، الزبدة، اللحوم، الأرز، الحليب كامل الدسم)"
      : bmi < 25
      ? "حافظ على توازن بين البروتين والكربوهيدرات، وتجنب السكريات المضافة"
      : bmi < 30
      ? "قلل الأطعمة الدهنية والسكريات، وركز على الخضروات والبروتينات الخفيفة"
      : "ابدأ خطة غذائية منخفضة السعرات بإشراف مختص، مع نشاط بدني يومي";

  // 🔹 حساب الوزن المثالي والفارق
  const minIdeal = 18.5 * h * h;
  const maxIdeal = 24.9 * h * h;
  const avgIdeal = ((minIdeal + maxIdeal) / 2).toFixed(1);
  const diff = (w - avgIdeal).toFixed(1);
  const diffText =
    diff > 0
      ? `🔻 تحتاج لخسارة حوالي ${diff} كجم للوصول إلى الوزن المثالي.`
      : diff < 0
      ? `🔺 تحتاج لزيادة حوالي ${Math.abs(diff)} كجم للوصول إلى الوزن المثالي.`
      : `✅ وزنك مثالي تمامًا.`;

  // 🔹 جدول النشاط (WHO معتمد)
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
  🔹 <strong>الحد الأقصى للسكر:</strong> ${sugar} جرام/يوم<br>
  🔹 <strong>نصيحة غذائية:</strong> ${foodAdvice}<br><br>
  <strong>🧭 جدول نشاط بدني معتمد من منظمة الصحة العالمية:</strong><br>${table}
  `;
});

// 🔁 تفريغ الحقول
document.getElementById("btnResetBMI").addEventListener("click", () => {
  document.getElementById("height").value = "";
  document.getElementById("weight").value = "";
  document.getElementById("bmiResult").innerHTML = "";
});

// 🍎 محرك البحث الغذائي الذكي
document.getElementById("btnSearchFood").addEventListener("click", async () => {
  const query = document.getElementById("foodInput").value.trim();
  const foodResult = document.getElementById("foodResult");
  if (!query) return (foodResult.innerHTML = "⚠️ الرجاء كتابة اسم الطعام للبحث عنه.");

  foodResult.innerHTML = "⏳ جاري البحث عن المعلومات الغذائية...";

  try {
    // البحث عبر واجهة OpenFoodFacts
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/search?fields=product_name,nutriments&limit=1&search_terms=${encodeURIComponent(
        query
      )}`
    );
    const data = await res.json();

    if (!data.products || data.products.length === 0)
      throw new Error("لا توجد نتائج لهذا العنصر.");

    const p = data.products[0];
    const n = p.nutriments || {};

    foodResult.innerHTML = `
      ✅ <strong>${p.product_name || query}</strong><br>
      🔹 <strong>السعرات:</strong> ${n["energy-kcal_100g"] || "غير متوفر"} /100g<br>
      🔹 <strong>البروتين:</strong> ${n.proteins_100g || "غير متوفر"} جم<br>
      🔹 <strong>الدهون:</strong> ${n.fat_100g || "غير متوفر"} جم<br>
      🔹 <strong>الكربوهيدرات:</strong> ${n.carbohydrates_100g || "غير متوفر"} جم<br>
      🔹 <strong>الألياف:</strong> ${n.fiber_100g || "غير متوفر"} جم<br>
      🔹 <strong>السكر:</strong> ${n.sugars_100g || "غير متوفر"} جم<br>
      🔹 <strong>الملح:</strong> ${n.salt_100g || "غير متوفر"} جم
    `;
  } catch (e) {
    // fallback للبيانات المحلية
    const localFoods = {
      "بيض": { calories: 155, protein: 13, fat: 11, carbs: 1.1, fiber: 0, sugar: 1.1 },
      "تفاح": { calories: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4, sugar: 10 },
      "لبن": { calories: 42, protein: 3.4, fat: 1, carbs: 5, fiber: 0, sugar: 5 },
    };
    const item = localFoods[query];
    if (item) {
      foodResult.innerHTML = `
        ✅ <strong>${query}</strong><br>
        🔹 <strong>السعرات:</strong> ${item.calories} /100g<br>
        🔹 <strong>البروتين:</strong> ${item.protein} جم<br>
        🔹 <strong>الدهون:</strong> ${item.fat} جم<br>
        🔹 <strong>الكربوهيدرات:</strong> ${item.carbs} جم<br>
        🔹 <strong>الألياف:</strong> ${item.fiber} جم<br>
        🔹 <strong>السكر:</strong> ${item.sugar} جم
      `;
    } else {
      foodResult.innerHTML = "❌ لم يتم العثور على نتائج، حاول كتابة الاسم بالعربية أو الإنجليزية.";
    }
  }
});
