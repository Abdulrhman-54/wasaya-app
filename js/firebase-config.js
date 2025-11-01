// /js/firebase-config.js
// ضع هنا مفاتيح مشروع Firebase كما هي من لوحة التحكم
// Settings > Project settings > Your apps > CDN

window.WASAYA_FIREBASE_CONFIG = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID",
};

// تفعيل reCAPTCHA غير المرئي لطلب OTP
window.__wasaya_setupFirebase = function() {
  if (!window.firebase || !window.WASAYA_FIREBASE_CONFIG) return;

  firebase.initializeApp(window.WASAYA_FIREBASE_CONFIG);
  // مُهيّئ لاحقًا داخل app.js عند الضغط على إرسال الرمز
};
