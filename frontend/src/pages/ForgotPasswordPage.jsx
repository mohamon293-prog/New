import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Mail, Key, ArrowRight, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("يرجى إدخال البريد الإلكتروني");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      toast.success(response.data.message);
      
      // In development, show the OTP
      if (response.data.dev_otp) {
        toast.info(`رمز التحقق (للتطوير): ${response.data.dev_otp}`, { duration: 10000 });
      }
      
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.detail || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!otp) {
      toast.error("يرجى إدخال رمز التحقق");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        otp,
        new_password: newPassword
      });
      
      toast.success("تم تغيير كلمة المرور بنجاح");
      setStep(3);
      
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      toast.error(error.response?.data?.detail || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-heading text-3xl font-black text-primary">
            Gamelo
          </Link>
          <h1 className="font-heading text-2xl font-bold mt-6">استعادة كلمة المرور</h1>
          <p className="text-muted-foreground mt-2">
            {step === 1 && "أدخل بريدك الإلكتروني لاستعادة كلمة المرور"}
            {step === 2 && "أدخل رمز التحقق وكلمة المرور الجديدة"}
            {step === 3 && "تم تغيير كلمة المرور بنجاح!"}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border">
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <Label>البريد الإلكتروني</Label>
                <div className="relative mt-1">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="pr-10"
                    dir="ltr"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label>رمز التحقق</Label>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest"
                  dir="ltr"
                  maxLength={6}
                  required
                />
              </div>
              
              <div>
                <Label>كلمة المرور الجديدة</Label>
                <div className="relative mt-1">
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                    dir="ltr"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label>تأكيد كلمة المرور</Label>
                <div className="relative mt-1">
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                    dir="ltr"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "جاري التغيير..." : "تغيير كلمة المرور"}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep(1)}
              >
                <ArrowRight className="h-4 w-4 ml-2" />
                رجوع
              </Button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">تم بنجاح!</h3>
              <p className="text-muted-foreground text-sm mb-4">
                تم تغيير كلمة المرور. جاري التحويل لصفحة تسجيل الدخول...
              </p>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          تذكرت كلمة المرور؟{" "}
          <Link to="/login" className="text-primary hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
