import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { MessageCircle } from "lucide-react";
import { Button } from "../components/ui/button";

export default function FAQPage() {
  const faqs = [
    {
      question: "ما هي قيملو؟",
      answer:
        "قيملو هو متجر إلكتروني موثوق لبيع أكواد الألعاب الرقمية وبطاقات الهدايا للمنصات المختلفة مثل PlayStation, Xbox, Steam, Nintendo وغيرها. نخدم العملاء في الأردن والشرق الأوسط.",
    },
    {
      question: "كيف يتم التوصيل؟",
      answer:
        "التوصيل فوري وتلقائي! بعد إتمام عملية الشراء والدفع، يمكنك كشف الكود فوراً من صفحة 'طلباتي'. لا يوجد انتظار أو شحن فيزيائي.",
    },
    {
      question: "كيف أشحن محفظتي؟",
      answer:
        "يتم شحن المحفظة يدوياً من خلال التواصل معنا عبر واتساب. أرسل لنا المبلغ المطلوب وطريقة الدفع المفضلة (كاش، حوالة بنكية، CliQ) وسنقوم بشحن محفظتك خلال دقائق.",
    },
    {
      question: "هل الأكواد أصلية ومضمونة؟",
      answer:
        "نعم، جميع الأكواد أصلية 100% ومن مصادر رسمية موثوقة. في حالة وجود أي مشكلة في الكود قبل كشفه، نقدم استبدال فوري أو استرداد للمحفظة.",
    },
    {
      question: "هل يمكن استرداد المبلغ بعد كشف الكود؟",
      answer:
        "لا، بعد كشف الكود لا يمكن استرداد المبلغ لأن الكود يصبح معروفاً. هذه سياسة عامة للمنتجات الرقمية. تأكد من جاهزيتك لاستخدام الكود قبل كشفه.",
    },
    {
      question: "كيف أختار المنطقة الصحيحة؟",
      answer:
        "المنطقة (Region) تعتمد على حساب PlayStation/Xbox/Nintendo الخاص بك. حسابات الإمارات تحتاج أكواد UAE، حسابات السعودية تحتاج أكواد KSA، وهكذا. إذا كنت غير متأكد، تواصل معنا وسنساعدك.",
    },
    {
      question: "ماذا أفعل إذا الكود لا يعمل؟",
      answer:
        "تواصل معنا فوراً عبر واتساب مع لقطة شاشة لرسالة الخطأ. سنتحقق من المشكلة ونقدم حل فوري (كود بديل أو استرداد للمحفظة) إذا كان الكود غير صالح.",
    },
    {
      question: "هل يمكنني الشراء بدون حساب؟",
      answer:
        "لا، يجب إنشاء حساب للشراء. هذا يساعدنا على حفظ طلباتك وأكوادك بشكل آمن، ويتيح لك إدارة محفظتك بسهولة.",
    },
    {
      question: "ما هي طرق الدفع المتاحة؟",
      answer:
        "حالياً نقبل الدفع عن طريق شحن المحفظة (كاش، حوالة بنكية، CliQ). تواصل معنا لمعرفة تفاصيل الدفع.",
    },
    {
      question: "هل تقدمون خصومات؟",
      answer:
        "نعم! نقدم خصومات دورية وعروض خاصة. تابعنا على وسائل التواصل الاجتماعي واشترك في النشرة البريدية لتصلك العروض أولاً.",
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="bg-card border-b border-border">
        <div className="section-container py-8">
          <h1 className="font-heading text-3xl font-bold">الأسئلة الشائعة</h1>
          <p className="text-muted-foreground mt-2">
            إجابات لأكثر الأسئلة شيوعاً
          </p>
        </div>
      </div>

      <div className="section-container py-8">
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border rounded-xl px-4 bg-card"
              >
                <AccordionTrigger className="text-right font-heading font-bold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Contact CTA */}
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 text-center">
            <h3 className="font-heading text-xl font-bold mb-2">
              لم تجد إجابة سؤالك؟
            </h3>
            <p className="text-muted-foreground mb-4">
              فريق الدعم متواجد 24/7 لمساعدتك
            </p>
            <a href="https://wa.me/9620798908935" target="_blank" rel="noopener noreferrer">
              <Button className="gap-2">
                <MessageCircle className="h-5 w-5" />
                تواصل معنا
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
