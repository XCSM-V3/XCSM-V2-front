"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Carte Métrique Analytics
// components/analytics/MetricCard.tsx
// ─────────────────────────────────────────────

import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: { value: number; label: string };
    variant?: "default" | "success" | "warning" | "danger" | "info";
}

const VARIANTS = {
    default: {
        bg: "bg-card",
        icon: "bg-primary/10 text-primary",
        trend_up: "text-primary",
        trend_down: "text-destructive",
    },
    success: {
        bg: "bg-card",
        icon: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        trend_up: "text-green-600",
        trend_down: "text-destructive",
    },
    warning: {
        bg: "bg-card",
        icon: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        trend_up: "text-amber-600",
        trend_down: "text-destructive",
    },
    danger: {
        bg: "bg-card",
        icon: "bg-destructive/10 text-destructive",
        trend_up: "text-green-600",
        trend_down: "text-destructive",
    },
    info: {
        bg: "bg-card",
        icon: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        trend_up: "text-blue-600",
        trend_down: "text-destructive",
    },
};

export default function MetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    variant = "default",
}: MetricCardProps) {
    const v = VARIANTS[variant];
    const isPositive = trend && trend.value >= 0;

    return (
        <div className={`${v.bg} rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${v.icon}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <span className={`text-xs font-medium flex items-center gap-0.5 ${isPositive ? v.trend_up : v.trend_down}`}>
                        {isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                    </span>
                )}
            </div>
            <div className="space-y-0.5">
                <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
                <p className="text-sm font-medium text-foreground/80">{title}</p>
                {subtitle && (
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                )}
                {trend && (
                    <p className="text-xs text-muted-foreground">{trend.label}</p>
                )}
            </div>
        </div>
    );
}