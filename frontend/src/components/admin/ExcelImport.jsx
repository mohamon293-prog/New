/**
 * Excel Import Component
 */
import React, { useState, useRef } from "react";
import {
  toast, Button, FileSpreadsheet, Upload
} from "./shared";

const ExcelImport = () => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success(`تم اختيار الملف: ${selectedFile.name}`);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    
    // This would be a real API call in production
    setTimeout(() => {
      toast.success("تم استيراد المنتجات بنجاح");
      setFile(null);
      setImporting(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="font-heading text-xl md:text-2xl font-bold">رفع المنتجات عبر Excel</h2>
      
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <h3 className="font-bold mb-2">رفع ملف Excel أو CSV</h3>
          <p className="text-sm text-muted-foreground mb-4">اسحب الملف هنا أو اضغط للاختيار</p>
          
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".xlsx,.xls,.csv" className="hidden" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 ml-2" /> اختر ملف
          </Button>
          
          {file && (
            <div className="mt-4 p-3 rounded-lg bg-secondary">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          )}
        </div>
        
        {file && (
          <Button onClick={handleImport} disabled={importing} className="w-full mt-4">
            {importing ? "جاري الاستيراد..." : "استيراد المنتجات"}
          </Button>
        )}
      </div>
      
      <div className="p-4 rounded-xl bg-card border border-border">
        <h3 className="font-bold mb-3">📋 تنسيق الملف المطلوب</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-right py-2">العمود</th>
                <th className="text-right py-2">الوصف</th>
                <th className="text-right py-2">مثال</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b"><td className="py-2">name</td><td>اسم المنتج</td><td>بلايستيشن بلس 12 شهر</td></tr>
              <tr className="border-b"><td className="py-2">category</td><td>القسم</td><td>playstation</td></tr>
              <tr className="border-b"><td className="py-2">type</td><td>النوع</td><td>digital_code / existing_account / new_account</td></tr>
              <tr className="border-b"><td className="py-2">price_jod</td><td>السعر (د.أ)</td><td>25.00</td></tr>
              <tr className="border-b"><td className="py-2">price_usd</td><td>السعر ($)</td><td>35.00</td></tr>
              <tr className="border-b"><td className="py-2">image_url</td><td>رابط الصورة</td><td>https://...</td></tr>
              <tr><td className="py-2">codes</td><td>الأكواد (مفصولة بـ |)</td><td>CODE1|CODE2|CODE3</td></tr>
            </tbody>
          </table>
        </div>
        
        <Button variant="outline" className="mt-4">
          <FileSpreadsheet className="h-4 w-4 ml-2" /> تحميل نموذج Excel
        </Button>
      </div>
    </div>
  );
};

export default ExcelImport;
