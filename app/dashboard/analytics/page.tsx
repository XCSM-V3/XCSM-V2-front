"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Dashboard Analytics Enseignant
// app/dashboard/analytics/page.tsx
// ─────────────────────────────────────────────

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    BarChart3, Users, Clock, TrendingUp, AlertTriangle,
    MessageSquare, BookOpen, Loader2, Bell, CheckCheck,
    RefreshCw, ChevronDown, Eye, Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import MetricCard from "@/components/analytics/MetricCard";
import DifficultyZones from "@/components/analytics/DifficultyZones";
import QCMGenerator from "@/components/analytics/QCMGenerator";
import SynthesisGenerator from "@/components/analytics/SynthesisGenerator";
import type { CourseAnalytics, PedagogicalAlert } from "../../../types/analytics.types";

type Period = 7 | 14 | 30;
type ActiveTab = "overview" | "zones" | "qcm" | "synthesis";

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
    return `${(seconds / 3600).toFixed(1)}h`;
}

export default function AnalyticsDashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    const [courses, setCourses] = useState<{ id: string; titre: string }[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [period, setPeriod] = useState<Period>(7);
    const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

    const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
    const [alerts, setAlerts] = useState<PedagogicalAlert[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Granules du cours sélectionné (pour QCM et synthèse)
    const [courseGranules, setCourseGranules] = useState<
        { id: string; title: string; content: string }[]
    >([]);

    // Redirection si non enseignant
    useEffect(() => {
        if (!authLoading && isAuthenticated && user?.role !== "enseignant") {
            router.push("/dashboard");
        }
    }, [authLoading, isAuthenticated, user, router]);

    // Charger les cours de l'enseignant
    useEffect(() => {
        if (!isAuthenticated || user?.role !== "enseignant") return;
        api.getMyCourses().then((data) => {
            setCourses(data.map((c) => ({ id: c.id, titre: c.titre })));
            if (data.length > 0) setSelectedCourseId(data[0].id);
        }).catch(console.error);
    }, [isAuthenticated, user]);

    // Charger les analytics du cours sélectionné
    const loadAnalytics = useCallback(async () => {
        if (!selectedCourseId) return;
        setIsLoading(true);
        setError(null);

        try {
            const token = typeof window !== "undefined"
                ? localStorage.getItem("access_token")
                : null;

            const res = await fetch(
                `/api/analytics/dashboard?course_id=${selectedCourseId}&period=${period}`,
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );

            if (!res.ok) throw new Error(`Erreur ${res.status}`);
            const data = await res.json();

            setAnalytics(data.analytics);
            setAlerts(data.alerts ?? []);
            setIsDemoMode(data.mode === "demo");

            // Charger les granules pour QCM/Synthèse
            try {
                const courseContent = await api.getCourseContent(selectedCourseId);
                const granules: { id: string; title: string; content: string }[] = [];
                courseContent?.parties?.forEach((p: any) => {
                    p.chapitres?.forEach((c: any) => {
                        c.sections?.forEach((s: any) => {
                            s.sous_sections?.forEach((ss: any) => {
                                ss.granules?.forEach((g: any) => {
                                    granules.push({
                                        id: g.id,
                                        title: g.titre,
                                        content: g.contenu?.html_content ?? g.contenu?.content ?? "",
                                    });
                                });
                            });
                        });
                    });
                });
                setCourseGranules(granules);
            } catch {
                // Granules non critiques
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur chargement");
        } finally {
            setIsLoading(false);
        }
    }, [selectedCourseId, period]);

    useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

    const unreadAlerts = alerts.filter((a) => !a.is_read);
    const selectedCourseTitle = courses.find((c) => c.id === selectedCourseId)?.titre ?? "";

    const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
        { id: "overview", label: "Vue d'ensemble", icon: <BarChart3 className="w-4 h-4" /> },
        { id: "zones", label: "Zones difficiles", icon: <AlertTriangle className="w-4 h-4" /> },
        { id: "qcm", label: "Générer un QCM", icon: <Zap className="w-4 h-4" /> },
        { id: "synthesis", label: "Fiche de révision", icon: <BookOpen className="w-4 h-4" /> },
    ];

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* ── En-tête ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        Analytics & Diagnostics
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Métriques pédagogiques et outils de conception
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Badge alertes */}
                    {unreadAlerts.length > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 border border-destructive/30 rounded-full">
                            <Bell className="w-3.5 h-3.5 text-destructive" />
                            <span className="text-xs font-medium text-destructive">
                                {unreadAlerts.length} alerte{unreadAlerts.length > 1 ? "s" : ""}
                            </span>
                        </div>
                    )}

                    {/* Mode démo */}
                    {isDemoMode && (
                        <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800">
                            Mode démo
                        </span>
                    )}

                    {/* Rafraîchir */}
                    <button
                        onClick={loadAnalytics}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-40"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        Actualiser
                    </button>
                </div>
            </div>

            {/* ── Sélecteurs ── */}
            <div className="flex flex-wrap gap-3">
                {/* Sélecteur cours */}
                <div className="relative">
                    <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="appearance-none pl-4 pr-9 py-2 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-w-[220px]"
                    >
                        {courses.length === 0 ? (
                            <option value="">Aucun cours</option>
                        ) : (
                            courses.map((c) => (
                                <option key={c.id} value={c.id}>{c.titre}</option>
                            ))
                        )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>

                {/* Sélecteur période */}
                <div className="flex border border-input rounded-xl overflow-hidden bg-background">
                    {([7, 14, 30] as Period[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 text-sm transition-colors ${period === p
                                ? "bg-primary text-primary-foreground font-medium"
                                : "text-muted-foreground hover:bg-muted"
                                }`}
                        >
                            {p}j
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Erreur ── */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-xl text-sm text-destructive">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* ── Chargement ── */}
            {isLoading && (
                <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Chargement des données…</p>
                    </div>
                </div>
            )}

            {/* ── Contenu principal ── */}
            {!isLoading && analytics && (
                <div className="space-y-5">
                    {/* Onglets */}
                    <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit flex-wrap">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                                {tab.id === "zones" && analytics.difficult_zones.length > 0 && (
                                    <span className="ml-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                                        {analytics.difficult_zones.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ── TAB : Vue d'ensemble ── */}
                    {activeTab === "overview" && (
                        <div className="space-y-5">
                            {/* Métriques principales */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <MetricCard
                                    title="Consultations"
                                    value={analytics.total_views.toLocaleString("fr-FR")}
                                    subtitle={`Sur ${period} jours`}
                                    icon={Eye}
                                    variant="default"
                                />
                                <MetricCard
                                    title="Apprenants actifs"
                                    value={analytics.unique_learners}
                                    subtitle="Sessions uniques"
                                    icon={Users}
                                    variant="info"
                                />
                                <MetricCard
                                    title="Taux de complétion"
                                    value={`${analytics.avg_completion_rate}%`}
                                    subtitle="Moyenne du cours"
                                    icon={TrendingUp}
                                    variant={analytics.avg_completion_rate >= 70 ? "success" : analytics.avg_completion_rate >= 45 ? "warning" : "danger"}
                                />
                                <MetricCard
                                    title="Durée moyenne"
                                    value={formatDuration(analytics.avg_session_duration)}
                                    subtitle="Par granule"
                                    icon={Clock}
                                    variant="default"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <MetricCard
                                    title="Questions IA posées"
                                    value={analytics.total_ai_interactions}
                                    subtitle="Interactions assistante"
                                    icon={MessageSquare}
                                    variant="info"
                                />
                                <MetricCard
                                    title="Zones difficiles"
                                    value={analytics.difficult_zones.length}
                                    subtitle="Notions avec score > 65"
                                    icon={AlertTriangle}
                                    variant={analytics.difficult_zones.length > 0 ? "danger" : "success"}
                                />
                                <MetricCard
                                    title="Alertes actives"
                                    value={unreadAlerts.length}
                                    subtitle="À traiter"
                                    icon={Bell}
                                    variant={unreadAlerts.length > 0 ? "warning" : "success"}
                                />
                            </div>

                            {/* Alertes pédagogiques */}
                            {alerts.length > 0 && (
                                <div className="bg-card border border-border rounded-xl p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                                            <Bell className="w-4 h-4 text-amber-500" />
                                            Alertes pédagogiques
                                        </h3>
                                        <span className="text-xs text-muted-foreground">{alerts.length} signalement{alerts.length > 1 ? "s" : ""}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {alerts.slice(0, 4).map((alert) => (
                                            <div
                                                key={alert.id}
                                                className={`flex items-start gap-3 p-3 rounded-lg border ${alert.severity === "critical"
                                                    ? "bg-destructive/5 border-destructive/20"
                                                    : alert.severity === "warning"
                                                        ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                                                        : "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                                                    }`}
                                            >
                                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alert.severity === "critical" ? "bg-destructive" :
                                                    alert.severity === "warning" ? "bg-amber-500" : "bg-blue-500"
                                                    }`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground">{alert.message}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.detail}</p>
                                                </div>
                                                <span className={`text-xs font-semibold flex-shrink-0 ${alert.severity === "critical" ? "text-destructive" :
                                                    alert.severity === "warning" ? "text-amber-600 dark:text-amber-400" : "text-blue-600"
                                                    }`}>
                                                    {alert.percentage}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Top consultés / Moins consultés */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="bg-card border border-border rounded-xl p-5">
                                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                        Plus consultés
                                    </h3>
                                    <div className="space-y-2.5">
                                        {analytics.most_consulted.map((g, i) => (
                                            <div key={g.granule_id} className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-muted-foreground w-4 flex-shrink-0">
                                                    {i + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-foreground truncate">{g.granule_title}</p>
                                                    <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full"
                                                            style={{ width: `${(g.views / analytics.most_consulted[0].views) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <span className="text-xs text-muted-foreground flex-shrink-0">{g.views} vues</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-card border border-border rounded-xl p-5">
                                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-muted-foreground" />
                                        Navigation suggérée
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Parcours recommandé basé sur les habitudes d&apos;apprentissage
                                    </p>
                                    <div className="space-y-2">
                                        {analytics.most_consulted.slice(0, 3).map((g, i) => (
                                            <div key={g.granule_id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                                    {i + 1}
                                                </div>
                                                <p className="text-xs text-foreground truncate">{g.granule_title}</p>
                                                <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
                                                    ≈{formatDuration(g.avg_time_seconds)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TAB : Zones difficiles ── */}
                    {activeTab === "zones" && (
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    Carte de difficulté du cours
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />Maîtrisé</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Moyen</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" />Difficile</span>
                                </div>
                            </div>
                            <DifficultyZones granules={analytics.granule_metrics} />
                        </div>
                    )}

                    {/* ── TAB : Générateur QCM ── */}
                    {activeTab === "qcm" && (
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="mb-5">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-primary" />
                                    Conception assistée d&apos;évaluations
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Générez des QCM de qualité basés sur le contenu réel de vos cours
                                </p>
                            </div>
                            <QCMGenerator
                                courseId={selectedCourseId}
                                courseTitle={selectedCourseTitle}
                                availableGranules={courseGranules}
                            />
                        </div>
                    )}

                    {/* ── TAB : Fiche de révision ── */}
                    {activeTab === "synthesis" && (
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="mb-5">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-primary" />
                                    Fiches de synthèse dynamiques
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Générez des fiches de révision transversales pour vos étudiants
                                </p>
                            </div>
                            <SynthesisGenerator
                                courseTitle={selectedCourseTitle}
                                availableGranules={courseGranules}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* État vide */}
            {!isLoading && !analytics && !error && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        {courses.length === 0 ? "Aucun cours disponible" : "Sélectionnez un cours"}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        {courses.length === 0
                            ? "Créez votre premier cours pour accéder aux analytics."
                            : "Les données analytics s'afficheront ici."}
                    </p>
                </div>
            )}
        </div>
    );
}