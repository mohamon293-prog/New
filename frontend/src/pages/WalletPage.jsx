import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { formatPrice, formatDate, API_URL, getAuthHeader } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "sonner";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  MessageCircle,
} from "lucide-react";

export default function WalletPage() {
  const { user, refreshUser } = useAuth();
  const [balance, setBalance] = useState({ jod: 0, usd: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [balanceRes, txRes] = await Promise.all([
        axios.get(`${API_URL}/wallet/balance`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/wallet/transactions`, { headers: getAuthHeader() }),
      ]);
      
      setBalance({
        jod: balanceRes.data.balance_jod || balanceRes.data.balance || 0,
        usd: balanceRes.data.balance_usd || 0
      });
      setTransactions(txRes.data || []);
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
      // Don't show error toast, just use default values
      setBalance({ jod: user?.wallet_balance_jod || user?.wallet_balance || 0, usd: user?.wallet_balance_usd || 0 });
    } finally {
      setLoading(false);
    }
  };

  const contactWhatsApp = () => {
    const message = encodeURIComponent(
      `مرحباً، أريد شحن محفظتي في قيملو.\nالبريد الإلكتروني: ${user?.email}`
    );
    window.open(`https://wa.me/9620798908935?text=${message}`, "_blank");
  };

  if (loading) {
    return (
      <div className="section-container py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl mt-6" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="section-container py-6">
          <h1 className="font-heading text-2xl md:text-3xl font-bold">
            المحفظة
          </h1>
          <p className="text-muted-foreground mt-1">إدارة رصيدك ومعاملاتك</p>
        </div>
      </div>

      <div className="section-container py-8">
        {/* Balance Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* JOD Balance */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">رصيد الدينار</p>
                  <p className="text-xs text-muted-foreground">JOD</p>
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold ltr-nums">
              {formatPrice(balance.jod, "JOD")}
            </div>
          </div>

          {/* USD Balance */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">رصيد الدولار</p>
                  <p className="text-xs text-muted-foreground">USD</p>
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold ltr-nums">
              {formatPrice(balance.usd, "USD")}
            </div>
          </div>
        </div>

        {/* Charge Wallet CTA */}
        <div className="p-6 rounded-2xl bg-card border border-border mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading text-lg font-bold mb-1">
                شحن المحفظة
              </h3>
              <p className="text-muted-foreground text-sm">
                تواصل معنا عبر واتساب لشحن رصيد محفظتك
              </p>
            </div>
            <Button onClick={contactWhatsApp} className="gap-2">
              <MessageCircle className="h-5 w-5" />
              تواصل معنا
            </Button>
          </div>
        </div>

        {/* Transactions */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-heading text-lg font-bold mb-6">
            سجل المعاملات
          </h3>

          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  data-testid={`transaction-${tx.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        tx.type === "credit"
                          ? "bg-green-500/20 text-green-500"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {tx.type === "credit" ? (
                        <ArrowDownRight className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{tx.reason}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(tx.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <div
                      className={`font-bold ltr-nums ${
                        tx.type === "credit" ? "text-green-500" : "text-destructive"
                      }`}
                    >
                      {tx.type === "credit" ? "+" : "-"}
                      {formatPrice(Math.abs(tx.amount), tx.currency)}
                    </div>
                    <p className="text-xs text-muted-foreground ltr-nums">
                      الرصيد: {formatPrice(tx.balance_after, tx.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد معاملات بعد</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
