import React from "react";
import { AlertTriangle } from "lucide-react";

export default function RefundPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-card border-b border-border">
        <div className="section-container py-8">
          <h1 className="font-heading text-3xl font-bold">سياسة الاسترداد</h1>
          <p className="text-muted-foreground mt-2">آخر تحديث: ديسمبر 2025</p>
        </div>
      </div>

      <div className="section-container py-8">
        <div className="prose prose-invert max-w-4xl">
          {/* Important Notice */}
          <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/30 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-8 w-8 text-destructive flex-shrink-0" />
              <div>
                <h3 className="font-heading text-lg font-bold text-destructive mb-2">
                  تنبيه هام جداً
                </h3>
                <p className="text-destructive/90 leading-relaxed">
                  طبيعة المنتجات الرقمية (Digital Goods) لا تسمح بالاسترداد بعد
                  كشف الكود. بمجرد الضغط على "كشف الكود"، يُعتبر المنتج مستخدماً
                  ولا يمكن استرداد المبلغ تحت أي ظرف.
                </p>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4">
              1. سياسة عدم الاسترداد للأكواد المكشوفة
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                • بمجرد كشف الكود، لا يمكن إرجاعه أو استبداله لأنه يصبح معروفاً
                للمستخدم.
              </li>
              <li>
                • نحتفظ بسجل كامل لعملية الكشف (الوقت، عنوان IP، بصمة الجهاز)
                كدليل قانوني.
              </li>
              <li>
                • الموافقة على الكشف تعني التنازل عن حق الاسترداد بشكل نهائي.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4">
              2. حالات الاسترداد المحتملة
            </h2>
            <p className="text-muted-foreground mb-4">
              قد نوافق على الاسترداد فقط في الحالات التالية (قبل كشف الكود):
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• كود لا يعمل (مع إثبات من خطأ الاسترداد)</li>
              <li>• منتج خاطئ تم تسليمه (منطقة أو منصة مختلفة)</li>
              <li>• خطأ تقني من جانبنا</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              <strong>ملاحظة:</strong> يجب تقديم الطلب خلال 24 ساعة من الشراء
              وقبل كشف الكود.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4">
              3. كيفية طلب الاسترداد
            </h2>
            <ol className="space-y-2 text-muted-foreground">
              <li>1. تواصل معنا عبر واتساب خلال 24 ساعة</li>
              <li>2. قدم رقم الطلب وسبب الاسترداد</li>
              <li>3. قدم إثبات المشكلة (لقطة شاشة لرسالة الخطأ)</li>
              <li>4. انتظر مراجعة الطلب (1-3 أيام عمل)</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4">
              4. طريقة الاسترداد
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              في حالة الموافقة، يتم استرداد المبلغ إلى رصيد المحفظة في قيملو.
              لا نقوم بالاسترداد النقدي المباشر.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4">
              5. الأساس القانوني
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              هذه السياسة متوافقة مع القوانين المتعلقة بالمنتجات الرقمية التي
              لا يمكن إرجاعها بعد الكشف عن محتواها. باستخدام خدماتنا، أنت
              توافق على هذه الشروط.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">6. التواصل</h2>
            <p className="text-muted-foreground">
              لطلب استرداد أو استفسار:{" "}
              <a
                href="https://wa.me/9620798908935"
                className="text-primary hover:underline"
              >
                تواصل عبر واتساب
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
