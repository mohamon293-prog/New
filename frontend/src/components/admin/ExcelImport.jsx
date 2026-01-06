/**
 * Excel Import Component
 */
import React, { useState, useRef } from "react";
import axios from "axios";
import { API_URL, getAuthHeader } from "../../lib/utils";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { FileSpreadsheet, Upload, Download, CheckCircle, XCircle } from "lucide-react";

const ExcelImport = () => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      toast.success(`تم اختيار الملف: ${selectedFile.name}`);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `${API_URL}/admin/products/import/excel`,
        formData,
        { 
          headers: { 
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setResult(response.data);
      toast.success(response.data.message || "تم الاستيراد بنجاح");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error("Import error:", error);
      const errorMsg = error.response?.data?.detail || "فشل في استيراد الملف";
      toast.error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `name,name_en,category,type,price_jod,price_usd,image_url,region,codes,description
بطاقة ستيم $10,Steam $10,steam,digital_code,7.5,10,https://placehold.co/400x400,عالمي,CODE1|CODE2|CODE3,بطاقة رصيد ستيم
بطاقة بلايستيشن $25,PlayStation $25,playstation,digital_code,19,25,https://placehold.co/400x400,US,PS-CODE-1|PS-CODE-2,بطاقة بلايستيشن ستور
حساب نتفلكس,Netflix Account,giftcards,existing_account,15,20,https://placehold.co/400x400,عالمي,,حساب نتفلكس جاهز`;
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products_template.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success("تم تحميل النموذج");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="font-heading text-xl md:text-2xl font-bold">رفع المنتجات عبر Excel</h2>
      
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <h3 className="font-bold mb-2">رفع ملف Excel أو CSV</h3>
          <p className="text-sm text-muted-foreground mb-4">اسحب الملف هنا أو اضغط للاختيار</p>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept=".xlsx,.xls,.csv" 
            className="hidden" 
          />
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
        
        {/* Import Result */}
        {result && (
          <div className="mt-4 p-4 rounded-lg bg-secondary">
            <div className="flex items-center gap-2 mb-3">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-bold">{result.message}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>المنتجات المضافة: <strong className="text-green-500">{result.products_added}</strong></div>
              <div>الأكواد المضافة: <strong className="text-blue-500">{result.codes_added}</strong></div>
            </div>
            {result.errors?.length > 0 && (
              <div className="mt-3 p-2 bg-red-500/10 rounded text-sm text-red-400">
                <p className="font-bold mb-1">أخطاء:</p>
                {result.errors.map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            )}
          </div>
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
              <tr className="border-b"><td className="py-2 font-mono">name</td><td>اسم المنتج *</td><td>بطاقة ستيم $10</td></tr>
              <tr className="border-b"><td className="py-2 font-mono">category</td><td>القسم</td><td>playstation, xbox, steam, nintendo, mobile, giftcards</td></tr>
              <tr className="border-b"><td className="py-2 font-mono">type</td><td>النوع</td><td>digital_code, existing_account, new_account</td></tr>
              <tr className="border-b"><td className="py-2 font-mono">price_jod</td><td>السعر (د.أ) *</td><td>25.00</td></tr>
              <tr className="border-b"><td className="py-2 font-mono">price_usd</td><td>السعر ($)</td><td>35.00</td></tr>
              <tr className="border-b"><td className="py-2 font-mono">image_url</td><td>رابط الصورة</td><td>https://...</td></tr>
              <tr className="border-b"><td className="py-2 font-mono">region</td><td>المنطقة</td><td>عالمي، US، UAE</td></tr>
              <tr><td className="py-2 font-mono">codes</td><td>الأكواد (مفصولة بـ |)</td><td>CODE1|CODE2|CODE3</td></tr>
            </tbody>
          </table>
        </div>
        
        <Button variant="outline" className="mt-4" onClick={downloadTemplate}>
          <Download className="h-4 w-4 ml-2" /> تحميل نموذج CSV
        </Button>
      </div>
    </div>
  );
};

export default ExcelImport;
