document.getElementById("btnCalcBMI").addEventListener("click", () => {
  const h = parseFloat(document.getElementById("height").value);
  const w = parseFloat(document.getElementById("weight").value);
  const resultDiv = document.getElementById("bmiResult");

  if (!h || !w) {
    resultDiv.innerHTML = "⚠️ من فضلك أدخل الطول والوزن";
    return;
  }

  // حساب مؤشر كتلة الجسم
  const bmi = (w / (h * h)).toFixed(1);

  // تحديد الحالة الصحية
  let status = "";
  if (bmi < 18.5) status = "نقص في الوزن";
  else if (bmi < 25) status = "وزن مثالي";
  else if (bmi < 30) status = "زيادة بسيطة في الوزن";
  else status = "سمنة";

  // حساب الوزن المثالي (منتصف النطاق الصحي 22.5)
  const idealWeight = (22.5 * h * h).toFixed(1);

  // الفارق بين الوزن الحالي والمثالي
  const diff = (w - idealWeight).toFixed(1);

  let weightMsg = "";
  if (diff > 0.5) {
    weightMsg = `🏋️‍♂️ تحتاج لخسارة <strong>${Math.abs(diff)} كجم</strong> لتصل إلى الوزن المثالي (${idealWeight} كجم).`;
  } else if (diff < -0.5) {
    weightMsg = `🍗 تحتاج لزيادة <strong>${Math.abs(diff)} كجم</strong> لتصل إلى الوزن المثالي (${idealWeight} كجم).`;
  } else {
    weightMsg = `✅ وزنك مثالي تقريبًا (${idealWeight} كجم).`;
  }

  // تقدير السعرات الحرارية
  let calories = 0;
  if (bmi < 18.5) calories = 2800;
  else if (bmi < 25) calories = 2300;
  else if (bmi < 30) calories = 1900;
  else calories = 1600;

  // نصيحة غذائية
  const advice =
    bmi < 18.5
      ? "🍳 تناول وجبات غنية بالبروتين والسعرات (مثل المكسرات، اللحوم، الأرز، الحليب كامل الدسم)."
      : bmi < 25
      ? "🥗 حافظ على توازن غذائي وتجنب السكريات المضافة."
      : bmi < 30
      ? "🚶‍♂️ قلل الدهون والسكريات، وزد من تناول الخضار والبروتين."
      : "⚠️ اتبع نظام غذائي منخفض السعرات ونشاط بدني يومي بإشراف مختص.";

  // عرض النتيجة
  resultDiv.innerHTML = `
    <h3>نتائج التحليل 👇</h3>
    🔹 <strong>BMI:</strong> ${bmi}<br>
    🔹 <strong>الحالة:</strong> ${status}<br>
    🔹 <strong>الوزن المثالي:</strong> ${idealWeight} كجم<br>
    🔹 ${weightMsg}<br>
    🔹 <strong>السعرات اليومية:</strong> ${calories} سعرة حرارية<br>
    🔹 <strong>النصيحة:</strong> ${advice}
  `;
});

// زر إعادة التعيين
document.getElementById("btnResetBMI").addEventListener("click", () => {
  document.getElementById("height").value = "";
  document.getElementById("weight").value = "";
  document.getElementById("bmiResult").innerHTML = "";
});
