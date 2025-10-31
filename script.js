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
