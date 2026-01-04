/**
 * Analytics Dashboard Component
 */
import React, { useState, useEffect } from "react";
import {
  axios, API_URL, getAuthHeader, toast,
  Badge, Skeleton, ShoppingCart, MessageSquare, Package
} from "./shared";

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/analytics/overview`, { headers: getAuthHeader() });
      setData(response.data);
    } catch (error) {
      toast.error("فشل في تحميل التحليلات");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">لوحة التحليلات</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30">
          <div className="text-2xl font-bold text-green-500">{data?.today?.revenue?.toFixed(2)} د.أ</div>
          <div className="text-sm text-muted-foreground">إيرادات اليوم</div>
          <div className="text-xs text-green-500 mt-1">{data?.today?.orders} طلب</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30">
          <div className="text-2xl font-bold text-blue-500">{data?.week?.revenue?.toFixed(2)} د.أ</div>
          <div className="text-sm text-muted-foreground">إيرادات الأسبوع</div>
          <div className="text-xs text-blue-500 mt-1">{data?.week?.orders} طلب</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
          <div className="text-2xl font-bold text-purple-500">{data?.month?.revenue?.toFixed(2)} د.أ</div>
          <div className="text-sm text-muted-foreground">إيرادات الشهر</div>
          <div className="text-xs text-purple-500 mt-1">{data?.month?.orders} طلب</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30">
          <div className="text-2xl font-bold text-orange-500">{data?.totals?.users}</div>
          <div className="text-sm text-muted-foreground">إجمالي المستخدمين</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20"><ShoppingCart className="h-5 w-5 text-yellow-500" /></div>
            <div>
              <div className="text-xl font-bold">{data?.totals?.pending_orders}</div>
              <div className="text-xs text-muted-foreground">طلبات معلقة</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20"><MessageSquare className="h-5 w-5 text-red-500" /></div>
            <div>
              <div className="text-xl font-bold">{data?.totals?.open_disputes}</div>
              <div className="text-xs text-muted-foreground">نزاعات مفتوحة</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20"><Package className="h-5 w-5 text-green-500" /></div>
            <div>
              <div className="text-xl font-bold">{data?.totals?.products}</div>
              <div className="text-xs text-muted-foreground">منتجات نشطة</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-card border border-border">
        <h3 className="font-bold mb-4">🔥 المنتجات الأكثر مبيعاً</h3>
        <div className="space-y-2">
          {data?.top_products?.map((product, i) => (
            <div key={product.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                <span>{product.name}</span>
              </div>
              <Badge variant="outline">{product.sold_count} مبيع</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
