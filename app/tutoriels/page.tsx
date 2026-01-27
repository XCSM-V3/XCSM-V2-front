"use client"

import { Suspense } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayCircle, FileText, Settings, Users, BookOpen, Upload, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

function TutorielsContent() {
    const searchParams = useSearchParams()
    const defaultTab = searchParams.get("tab") || "start"

    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1 container py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Centre d'Aide & Tutoriels</h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        Devenez un expert de XCSM. Retrouvez ici tous les guides pour créer, gérer et diffuser vos cours avec succès.
                    </p>
                </div>

                <Tabs defaultValue={defaultTab} className="w-full max-w-5xl mx-auto">
                    <TabsList className="grid w-full grid-cols-1 md:grid-cols-5 h-auto p-1">
                        <TabsTrigger value="start" className="py-3">Premiers Pas</TabsTrigger>
                        <TabsTrigger value="editor" className="py-3">Éditeur & Contenu</TabsTrigger>

                        <TabsTrigger value="students" className="py-3">Gestion Étudiants</TabsTrigger>
                        <TabsTrigger value="troubleshoot" className="py-3">Dépannage</TabsTrigger>
                    </TabsList>

                    {/* TAB: PREMIERS PAS */}
                    <TabsContent value="start" className="mt-8 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PlayCircle className="text-green-600" />
                                    Démarrage Rapide
                                </CardTitle>
                                <CardDescription>Les bases pour bien commencer sur la plateforme.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50/50 rounded-r">
                                    <h3 className="font-bold text-lg">1. Création de votre compte</h3>
                                    <p className="text-muted-foreground">Lors de votre première connexion, choisissez le rôle "Enseignant". Complétez votre profil avec votre établissement et vos matières de prédilection.</p>
                                </div>

                                <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50/50 rounded-r">
                                    <h3 className="font-bold text-lg">2. Votre Tableau de Bord</h3>
                                    <p className="text-muted-foreground">Le Dashboard est votre tour de contrôle. Vous y voyez vos cours récents et les statistiques.</p>
                                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                                        <Image
                                            src="/tutoriels/tuto-dashboard.png"
                                            alt="Dashboard XCSM"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </div>

                                <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50/50 rounded-r">
                                    <h3 className="font-bold text-lg">3. Configuration d'un Cours</h3>
                                    <p className="text-muted-foreground">Un cours est défini par un Titre, une Description, et une image de couverture. Vous pouvez choisir de le rendre "Public" (visible par tous) ou "Privé" (sur invitation uniquement).</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB: EDITEUR */}
                    <TabsContent value="editor" className="mt-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Upload className="text-blue-600" />
                                        Importation de Documents
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="mb-4 text-sm text-gray-600">
                                        Ne repartez pas de zéro. XCSM permet d'importer vos supports existants :
                                    </p>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-start gap-2">
                                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-bold">PDF</span>
                                            Notre moteur extrait le texte, les images et tente de reconstruire la hiérarchie des titres.
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-bold">Word</span>
                                            Importez vos fichiers .docx en conservant la mise en forme de base.
                                        </li>
                                    </ul>
                                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                                        <Image
                                            src="/tutoriels/tuto-editeur.png"
                                            alt="Éditeur XCSM"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ImageIcon className="text-purple-600" />
                                        Gestion Multimédia
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="mb-4 text-sm text-gray-600">
                                        Enrichissez vos cours pour les rendre captivants :
                                    </p>
                                    <ul className="space-y-2 text-sm">
                                        <li><strong>Images :</strong> Utilisez l'onglet "Ressources" à gauche de l'éditeur. Glissez-déposez simplement une image dans votre texte.</li>
                                        <li><strong>Vidéos :</strong> Intégrez des liens YouTube ou uploadez vos propres capsules pédagogiques (Mp4 supporté).</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Astuces de Mise en Page</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-3">
                                <div className="p-4 bg-gray-50 rounded border text-center">
                                    <h4 className="font-bold mb-2">Structure</h4>
                                    <p className="text-xs text-muted-foreground">Utilisez les titres H1, H2, H3 pour créer une table des matières automatique à gauche.</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded border text-center">
                                    <h4 className="font-bold mb-2">Tableaux</h4>
                                    <p className="text-xs text-muted-foreground">Insérez des tableaux pour présenter des données comparatives claires.</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded border text-center">
                                    <h4 className="font-bold mb-2">Export</h4>
                                    <p className="text-xs text-muted-foreground">À tout moment, exportez votre travail en PDF ou Word via les boutons en haut à droite.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>



                    {/* TAB: ETUDIANTS */}
                    <TabsContent value="students" className="mt-8 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="text-teal-600" />
                                    Suivi et Progession
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-4">Suivez l'avancement de votre classe en temps réel.</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong>Vue d'ensemble :</strong> Taux de complétion moyen du cours.</li>
                                    <li><strong>Par étudiant :</strong> Détail des scores aux QCM et temps de lecture.</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB: DEPANNAGE (NOUVEAU) */}
                    <TabsContent value="troubleshoot" className="mt-8 space-y-6">
                        <Card className="border-red-100 bg-red-50/30 dark:bg-red-900/10">
                            <CardHeader>
                                <CardTitle className="text-red-800 dark:text-red-300">Résolution des Problèmes Courants</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-bold text-red-700 dark:text-red-400">Document "En attente" bloqué ?</h4>
                                    <p className="text-sm">Si un document reste en statut "En attente" indéfiniment, cela signifie souvent que le fichier est trop complexe ou corrompu. Essayez de :</p>
                                    <ul className="list-disc pl-5 text-sm mt-1">
                                        <li>Rafraîchir la page (F5).</li>
                                        <li>Ré-exporter votre fichier en PDF standard ou DOCX simplifié.</li>
                                        <li>Vérifier qu'il ne contient pas de caractères spéciaux dans le nom.</li>
                                    </ul>
                                </div>
                                <div className="pt-4 border-t border-red-200">
                                    <h4 className="font-bold text-red-700 dark:text-red-400">Erreur API / Connexion</h4>
                                    <p className="text-sm">Si vous voyez une erreur "Erreur Serveur", déconnectez-vous et reconnectez-vous pour rafraîchir votre session.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="mt-16 bg-gradient-to-r from-gray-900 to-slate-800 text-white rounded-xl p-8 text-center shadow-2xl">
                    <h2 className="text-2xl font-bold mb-4">Vous ne trouvez pas la réponse ?</h2>
                    <p className="mb-6 opacity-80">Notre équipe de support pédagogique est là pour vous accompagner, du lundi au vendredi.</p>
                    <a href="mailto:support@studtech.fr" className="inline-flex items-center justify-center rounded-md bg-white text-slate-900 px-6 py-3 font-semibold hover:bg-gray-100 transition-colors">
                        Contacter le support
                    </a>
                </div>
            </main>
            <SiteFooter />
        </div>
    )
}

export default function TutorielsPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <TutorielsContent />
        </Suspense>
    )
}
