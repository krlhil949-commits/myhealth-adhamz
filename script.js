// ======================= إظهار الأقسام =======================
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// ======================= تسجيل الدخول البسيط =======================
function register() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (username && password) {
    localStorage.setItem(username, password);
    alert("تم إنشاء الحساب بنجاح!");
  } else {
    alert("يرجى إدخال اسم المستخدم وكلمة المرور");
  }
}

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (localStorage.getItem(username) === password) {
    alert(`مرحباً ${username}!`);
    showSection('bmi');
  } else {
    alert("بيانات الدخول غير صحيحة");
  }
}

// ======================= حساب BMI + BMR =======================
function calculateBMI() {
  const weight = parseFloat(document.getElementById("weight").value);
  const height = parseFloat(document.getElementById("height").value);

  if (!weight || !height) {
    alert("يرجى إدخال الوزن والطول بشكل صحيح");
    return;
  }

  const bmi = (weight / (height * height)).toFixed(2);
  const result = document.getElementById("bmiResult");
  const adviceList = document.getElementById("adviceList");
  const adviceSection = document.getElementById("adviceSection");
  const whoTable = document.getElementById("whoTable");

  // حساب السعرات اليومية (BMR) - Mifflin St Jeor
  // القيم افتراضية: العمر = 25 سنة، الجنس = ذكر
  const age = 25;
  const gender = "male"; // يمكن تغييره مستقبلاً عبر اختيار المستخدم
  const bmr = gender === "male"
    ? 10 * weight + 6.25 * (height * 100) - 5 * age + 5
    : 10 * weight + 6.25 * (height * 100) - 5 * age - 161;

  // النشاط المتوسط = ×1.55
  const maintenanceCalories = (bmr * 1.55).toFixed(0);
  const gainCalories = (maintenanceCalories * 1.15).toFixed(0);
  const lossCalories = (maintenanceCalories * 0.85).toFixed(0);

  result.innerHTML = `
    مؤشر كتلة جسمك هو: <strong>${bmi}</strong><br>
    السعرات اليومية المطلوبة للحفاظ على وزنك: <strong>${maintenanceCalories}</strong> سعرة حرارية<br>
    لزيادة الوزن: <strong>${gainCalories}</strong> سعرة حرارية<br>
    لإنقاص الوزن: <strong>${lossCalories}</strong> سعرة حرارية
  `;

  adviceList.innerHTML = "";
  whoTable.innerHTML = `
    <table style="width:100%; color:white;">
      <tr><th>الفئة</th><th>BMI</th></tr>
      <tr><td>نحيف</td><td>أقل من 18.5</td></tr>
      <tr><td>مثالي</td><td>18.5 - 24.9</td></tr>
      <tr><td>زيادة وزن</td><td>25 - 29.9</td></tr>
      <tr><td>سمنة</td><td>30 فأكثر</td></tr>
    </table>
  `;

  let message = "";
  if (bmi < 18.5) {
    message = "وزنك أقل من الطبيعي، تحتاج لزيادة السعرات تدريجياً.";
    adviceList.innerHTML = `
      <li>زد عدد الوجبات إلى 5 يومياً.</li>
      <li>تناول البروتينات (بيض، دجاج، لبن).</li>
      <li>نم جيداً لتقوية البناء العضلي.</li>
    `;
  } else if (bmi >= 18.5 && bmi <= 24.9) {
    message = "وزنك مثالي، حافظ على توازنك الغذائي.";
    adviceList.innerHTML = `
      <li>استمر في النشاط البدني المعتدل.</li>
      <li>تجنب الوجبات السريعة.</li>
    `;
  } else {
    message = "وزنك أعلى من الطبيعي، قلل السعرات وزد النشاط.";
    adviceList.innerHTML = `
      <li>مارس رياضة المشي 30 دقيقة يومياً.</li>
      <li>قلل من السكريات والدهون المشبعة.</li>
    `;
  }

  // جدول النشاط لحرق السعرات
  const burnTable = `
    <h4>كيفية حرق السعرات</h4>
    <table style="width:100%; color:white;">
      <tr><th>النشاط</th><th>30 دقيقة</th><th>60 دقيقة</th></tr>
      <tr><td>المشي السريع</td><td>150 سعرة</td><td>300 سعرة</td></tr>
      <tr><td>الجري المتوسط</td><td>300 سعرة</td><td>600 سعرة</td></tr>
      <tr><td>ركوب الدراجة</td><td>250 سعرة</td><td>500 سعرة</td></tr>
      <tr><td>تمارين المقاومة</td><td>200 سعرة</td><td>400 سعرة</td></tr>
    </table>
  `;

  result.innerHTML += `<br>${message}<br>${burnTable}`;
  adviceSection.classList.remove("hidden");
}

// ======================= محرك البحث الغذائي المتقدم =======================
let searchCount = 0;
const maxSearches = 5;
const foodCache = {}; // تخزين مؤقت للحماية من التكرار

// قاعدة بيانات موسعة محلياً (يمكن توصيلها بـ API لاحقاً)
const foodDB = {
  "بيض": { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0 },
  "لبن": { calories: 60, protein: 3, carbs: 5, fat: 3, fiber: 0 },
  "تفاح": { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4 },
  "أرز": { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
  "دجاج": { calories: 239, protein: 27, carbs: 0, fat: 14, fiber: 0 },
  "تونة": { calories: 132, protein: 28, carbs: 0, fat: 1, fiber: 0 },
  "شوفان": { calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 10 }
};

function searchFood() {
  if (searchCount >= maxSearches) {
    document.getElementById("searchLimit").innerText = "لقد وصلت إلى الحد الأقصى من عمليات البحث (5 مرات).";
    return;
  }

  const query = document.getElementById("foodInput").value.trim();
  const foodResults = document.getElementById("foodResults");
  foodResults.innerHTML = "";

  // التحقق من الحماية ضد التكرار
  if (foodCache[query]) {
    foodResults.innerHTML = foodCache[query];
    searchCount++;
    return;
  }

  if (foodDB[query]) {
    const food = foodDB[query];
    const html = `
      <div style="background:rgba(255,255,255,0.15); padding:10px; border-radius:10px;">
        <h3>${query}</h3>
        <p>السعرات الحرارية: ${food.calories}</p>
        <p>البروتين: ${food.protein} جم</p>
        <p>الكربوهيدرات: ${food.carbs} جم</p>
        <p>الدهون: ${food.fat} جم</p>
        <p>الألياف: ${food.fiber} جم</p>
      </div>`;
    foodResults.innerHTML = html;
    foodCache[query] = html; // حفظ النتيجة
  } else {
    foodResults.innerHTML = "<p>لم يتم العثور على هذا الطعام في قاعدة البيانات.</p>";
  }

  searchCount++;
  document.getElementById("searchLimit").innerText = `عمليات البحث المتبقية: ${maxSearches - searchCount}`;
}
