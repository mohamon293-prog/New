/**
 * Dashboard Stats Component
 */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL, getAuthHeader, formatPrice } from "../../lib/utils";
import { Skeleton } from "../../components/ui/skeleton";
import { Users, Package, ShoppingBag, DollarSign } from "lucide-react";

const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats`, { headers: getAuthHeader() });
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 md:h-28 rounded-xl" />)}
      </div>
    );
  }

  const statCards = [
    { icon: Users, label: "المستخدمين", value: stats?.total_users || 0, color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: ShoppingBag, label: "الطلبات", value: stats?.total_orders || 0, color: "text-green-500", bg: "bg-green-500/10" },
    { icon: Package, label: "المنتجات", value: stats?.total_products || 0, color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: DollarSign, label: "الإيرادات", value: formatPrice(stats?.total_revenue || 0, "JOD"), color: "text-yellow-500", bg: "bg-yellow-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {statCards.map((stat, index) => (
        <div key={index} className="p-3 md:p-4 rounded-xl bg-card border border-border">
          <div className={`h-9 w-9 md:h-10 md:w-10 rounded-lg ${stat.bg} flex items-center justify-center mb-2 md:mb-3`}>
            <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
          </div>
          <p className="text-lg md:text-2xl font-bold">{stat.value}</p>
          <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
