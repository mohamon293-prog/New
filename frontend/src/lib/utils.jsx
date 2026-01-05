import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (price, currency = "JOD") => {
  if (currency === "JOD") {
    return `${price.toFixed(2)} د.أ`;
  }
  return `$${price.toFixed(2)}`;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ar-JO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const formatDateShort = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ar-JO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

export const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const platformIcons = {
  playstation: "🎮",
  xbox: "🎮",
  steam: "💻",
  nintendo: "🎮",
  pc: "🖥️",
  mobile: "📱",
  giftcards: "🎁",
};

export const platformColors = {
  playstation: "bg-blue-600",
  xbox: "bg-green-600",
  steam: "bg-slate-700",
  nintendo: "bg-red-600",
  pc: "bg-purple-600",
  mobile: "bg-orange-500",
  giftcards: "bg-pink-500",
};
