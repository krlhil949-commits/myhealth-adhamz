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
  if (!u || !p) return alert("أدخل اسم المس
