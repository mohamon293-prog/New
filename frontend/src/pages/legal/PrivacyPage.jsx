import React from "react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-card border-b border-border">
        <div className="section-container py-8">
          <h1 className="font-heading text-3xl font-bold">سياسة الخصوصية</h1>
          <p className="text-muted-foreground mt-2">آخر تحديث: ديسمبر 2025</p>
        </div>
      </div>

      <div className="section-container py-8">
        <div className="prose prose-invert max-w-4xl">
          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4">
              1. المعلومات التي نجمعها
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• معلومات الحساب: الاسم، البريد الإلكتروني، رقم الهاتف</li>
              <li>• معلومات المعاملات: سجل الشراء، رصيد المحفظة</li>
              <li>
                • معلومات الجهاز: عنوان IP، نوع المتصفح، بصمة الجهاز (Device
                Fingerprint)
              </li>
              <li>• سجلات النشاط: تسجيل الدخول، عمليات الكشف، المعاملات</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4">
              2. كيف نستخدم معلوماتك
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• معالجة الطلبات وتوفير الخدمة</li>
              <li>• حماية الحسابات ومكافحة الاحتيال</li>
              <li>• تحسين تجربة المستخدم</li>
              <li>• التواصل معك بخصوص طلباتك</li>
              <li>• الامتثال للمتطلبات القانونية</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4">
              3. حماية البيانات
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              نستخدم أحدث تقنيات التشفير لحماية بياناتك. جميع كلمات المرور
              مشفرة باستخدام bcrypt، والأكواد مشفرة باستخدام Fernet encryption.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4">
              4. مشاركة البيانات
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              لا نبيع أو نشارك بياناتك الشخصية مع أطراف ثالثة، إلا في الحالات
              التالية:
            </p>
            <ul className="space-y-2 text-muted-foreground mt-2">
              <li>• بموجب أمر قضائي أو طلب قانوني</li>
              <li>• لحماية حقوقنا القانونية</li>
              <li>• للتحقيق في حالات الاحتيال</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4">
              5. ملفات تعريف الارتباط (Cookies)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتذكر تفضيلاتك. يمكنك
              تعطيلها من إعدادات المتصفح، لكن هذا قد يؤثر على بعض الوظائف.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4">
              6. حقوقك
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• الوصول إلى بياناتك الشخصية</li>
              <li>• طلب تصحيح البيانات الخاطئة</li>
              <li>• طلب حذف حسابك (مع الاحتفاظ بسجلات المعاملات)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">7. التواصل</h2>
            <p className="text-muted-foreground">
              لأي استفسارات حول الخصوصية:{" "}
              <a
                href="https://wa.me/9620798908935"
                className="text-primary hover:underline"
              >
                تواصل معنا
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
