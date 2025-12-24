import React from "react";
import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-card border-b border-border">
        <div className="section-container py-8">
          <h1 className="font-heading text-3xl font-bold">الشروط والأحكام</h1>
          <p className="text-muted-foreground mt-2">آخر تحديث: ديسمبر 2025</p>
        </div>
      </div>

      <div className="section-container py-8">
        <div className="prose prose-invert max-w-4xl">
          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4">1. مقدمة</h2>
            <p className="text-muted-foreground leading-relaxed">
              مرحباً بك في قيملو (Gamelo). باستخدامك لموقعنا وخدماتنا، فإنك توافق
              على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل
              استخدام الموقع.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4">
              2. طبيعة المنتجات الرقمية
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                • جميع المنتجات المعروضة هي أكواد رقمية (Digital Codes) لا يمكن
                استبدالها أو استردادها بعد الكشف عنها.
              </li>
              <li>
                • الأكواد صالحة للاستخدام مرة واحدة فقط ولا يمكن إعادة استخدامها.
              </li>
              <li>
                • يجب التأكد من المنطقة الجغرافية (Region) المناسبة قبل الشراء.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4">
              3. سياسة عدم الاسترداد
            </h2>
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 mb-4">
              <p className="text-destructive font-bold">تنبيه هام:</p>
              <p className="text-destructive/80 mt-2">
                بمجرد كشف الكود (Reveal)، يعتبر المنتج مستخدماً ولا يمكن
                استرداد المبلغ تحت أي ظرف. تأكد من جاهزيتك لاستخدام الكود قبل
                كشفه.
              </p>
            </div>
            <p className="text-muted-foreground">
              يتم تسجيل جميع عمليات الكشف مع معلومات الجهاز وعنوان IP كدليل
              قانوني.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4">
              4. إخلاء المسؤولية
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                • قيملو غير مسؤول عن أي حظر (Ban) قد يحدث من قبل الشركات
                المصنعة (Sony, Microsoft, Nintendo, Steam, etc.).
              </li>
              <li>
                • المستخدم مسؤول عن التأكد من توافق المنتج مع حسابه ومنطقته.
              </li>
              <li>
                • لا نتحمل مسؤولية أي مشاكل ناتجة عن سوء استخدام الأكواد.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4">
              5. حماية الحساب
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• المستخدم مسؤول عن حماية بيانات حسابه وكلمة المرور.</li>
              <li>
                • يجب الإبلاغ فوراً عن أي نشاط مشبوه في الحساب.
              </li>
              <li>• يحق لنا تعليق الحسابات المشبوهة دون إشعار مسبق.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4">6. تعديل الشروط</h2>
            <p className="text-muted-foreground">
              نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعار المستخدمين
              بالتغييرات الجوهرية عبر البريد الإلكتروني أو إشعار على الموقع.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">7. التواصل</h2>
            <p className="text-muted-foreground">
              لأي استفسارات حول هذه الشروط، تواصل معنا عبر:{" "}
              <a
                href="https://wa.me/9620798908935"
                className="text-primary hover:underline"
              >
                واتساب
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
