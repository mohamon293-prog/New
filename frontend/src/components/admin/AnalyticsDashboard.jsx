/**
 * Analytics Dashboard Component
 */
import React, { useState, useEffect } from "react";
import {
  axios, API_URL, getAuthHeader, toast,
  Badge, Skeleton, ShoppingCart, MessageSquare, Package, Button
} from "./shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Trash2, RefreshCw, TrendingUp, Users, DollarSign, Calendar } from "lucide-react";

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetDialog, setResetDialog] = useState(false);
  const [resetPeriod, setResetPeriod] = useState("all");
  const [resetting, setResetting] = useState(false);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/analytics/overview`, { headers: getAuthHeader() });
      setData(response.data);
    } catch (error) {
      toast.error("فشل في تحميل التحليلات");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await axios.delete(`${API_URL}/admin/analytics/reset?period=${resetPeriod}`, { headers: getAuthHeader() });
      toast.success("تم مسح التحليلات بنجاح");
      setResetDialog(false);
      fetchAnalytics();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في مسح التحليلات");
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="font-heading text-xl md:text-2xl font-bold">لوحة التحليلات</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 ml-1" />
            تحديث
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setResetDialog(true)}>
            <Trash2 className="h-4 w-4 ml-1" />
            مسح التحليلات
          </Button>
        </div>
      </div>

      {/* Period Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-500">اليوم</span>
          </div>
          <div className="text-3xl font-bold text-green-500">{(data?.today?.revenue || 0).toFixed(2)} <span className="text-lg">د.أ</span></div>
          <div className="text-sm text-muted-foreground mt-1">{data?.today?.orders || 0} طلب</div>
        </div>

        {/* This Week */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-blue-500">هذا الأسبوع</span>
          </div>
          <div className="text-3xl font-bold text-blue-500">{(data?.week?.revenue || 0).toFixed(2)} <span className="text-lg">د.أ</span></div>
          <div className="text-sm text-muted-foreground mt-1">{data?.week?.orders || 0} طلب</div>
        </div>

        {/* This Month */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium text-purple-500">هذا الشهر</span>
          </div>
          <div className="text-3xl font-bold text-purple-500">{(data?.month?.revenue || 0).toFixed(2)} <span className="text-lg">د.أ</span></div>
          <div className="text-sm text-muted-foreground mt-1">{data?.month?.orders || 0} طلب</div>
        </div>

        {/* Total Revenue */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium text-orange-500">إجمالي الإيرادات</span>
          </div>
          <div className="text-3xl font-bold text-orange-500">{(data?.totals?.revenue || 0).toFixed(2)} <span className="text-lg">د.أ</span></div>
          <div className="text-sm text-muted-foreground mt-1">{data?.totals?.orders || 0} طلب</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <div className="text-xl font-bold">{data?.totals?.users || 0}</div>
              <div className="text-xs text-muted-foreground">المستخدمين</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20"><Package className="h-5 w-5 text-green-500" /></div>
            <div>
              <div className="text-xl font-bold">{data?.totals?.products || 0}</div>
              <div className="text-xs text-muted-foreground">المنتجات</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20"><ShoppingCart className="h-5 w-5 text-blue-500" /></div>
            <div>
              <div className="text-xl font-bold">{data?.totals?.orders || 0}</div>
              <div className="text-xs text-muted-foreground">الطلبات</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20"><MessageSquare className="h-5 w-5 text-red-500" /></div>
            <div>
              <div className="text-xl font-bold">{data?.totals?.open_disputes || 0}</div>
              <div className="text-xs text-muted-foreground">نزاعات مفتوحة</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      {data?.top_products?.length > 0 && (
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="font-bold mb-4">🏆 أكثر المنتجات مبيعاً</h3>
          <div className="space-y-3">
            {data.top_products.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground">{index + 1}</span>
                  <span className="font-medium">{product.name || product._id}</span>
                </div>
                <Badge>{product.count} مبيعات</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Analytics Dialog */}
      <Dialog open={resetDialog} onOpenChange={setResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              مسح التحليلات
            </DialogTitle>
            <DialogDescription>
              اختر الفترة التي تريد مسح بياناتها. هذه العملية لا يمكن التراجع عنها.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary">
              <input type="radio" name="period" value="today" checked={resetPeriod === "today"} onChange={(e) => setResetPeriod(e.target.value)} />
              <span>اليوم فقط</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary">
              <input type="radio" name="period" value="week" checked={resetPeriod === "week"} onChange={(e) => setResetPeriod(e.target.value)} />
              <span>آخر 7 أيام</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary">
              <input type="radio" name="period" value="month" checked={resetPeriod === "month"} onChange={(e) => setResetPeriod(e.target.value)} />
              <span>آخر 30 يوم</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 cursor-pointer hover:bg-destructive/20">
              <input type="radio" name="period" value="all" checked={resetPeriod === "all"} onChange={(e) => setResetPeriod(e.target.value)} />
              <span className="text-destructive font-bold">مسح الكل</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialog(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleReset} disabled={resetting}>
              {resetting ? "جاري المسح..." : "مسح"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnalyticsDashboard;
