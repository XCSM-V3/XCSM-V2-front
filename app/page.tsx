"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  BookOpen,
  Brain,
  FileText,
  Share2,
  Users,
  Zap,
  CheckCircle,
  ArrowRight
} from "lucide-react"

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Suppression de la redirection automatique pour éviter les boucles et laisser le contrôle à l'utilisateur


  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
                  Plateforme Pédagogique Intelligente
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-foreground">
                  Créez des cours interactifs en quelques secondes
                </h1>
                <p className="text-xl font-semibold text-primary mt-2 mb-4">
                  eXtended Content Structured Module
                </p>
                Transformez vos documents PDF et Word en supports de cours structurés. Créez des expériences d'apprentissage interactives, gérez vos étudiants et suivez leur progression.
                <div className="flex flex-col gap-2 min-[400px]:flex-row pt-4">
                  <Button className="bg-primary hover:bg-primary/90 h-11 px-8" asChild>
                    <Link href="/inscription">Commencer gratuitement</Link>
                  </Button>
                  <Button variant="outline" className="h-11 px-8" asChild>
                    <Link href="/tutoriels">Voir comment ça marche</Link>
                  </Button>
                </div>
              </div>
              <div className="mx-auto lg:mx-0 lg:flex lg:justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent opacity-20 rounded-xl blur-2xl"></div>
                <img
                  src="/hero.png"
                  alt="Interface XCSM"
                  className="rounded-xl object-cover shadow-2xl border border-border relative z-10"
                  width={600}
                  height={400}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-foreground">
                Tout ce dont vous avez besoin pour enseigner
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                Une suite complète d'outils pour simplifier la création de contenu et l'engagement des étudiants.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-card p-8 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center mb-6">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Import Intelligent</h3>
                <p className="text-muted-foreground">
                  Importez vos cours existants (PDF, Word) en un clic. Notre IA analyse et structure automatiquement le contenu en chapitres et sections.
                </p>
              </div>



              {/* Feature 3 */}
              <div className="bg-card p-8 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-6">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Éditeur Riche</h3>
                <p className="text-muted-foreground">
                  Un éditeur de texte puissant avec gestion des images (glisser-déposer), vidéos, tableaux et formules mathématiques.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-card p-8 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center mb-6">
                  <Share2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Partage & Publication</h3>
                <p className="text-muted-foreground">
                  Publiez vos cours en un clic. Vos étudiants y accèdent instantanément sur leur espace dédié, sur ordinateur ou mobile.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-card p-8 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center mb-6">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Suivi Étudiants</h3>
                <p className="text-muted-foreground">
                  Tableau de bord complet pour suivre la progression de vos étudiants, leurs résultats aux exercices et leur assiduité.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-card p-8 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg flex items-center justify-center mb-6">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Export Multi-formats</h3>
                <p className="text-muted-foreground">
                  Besoin d'imprimer ? Exportez vos cours magnifiquement formatés en Word ou PDF en conservant toute la mise en page.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits / How it works */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-primary/10 rounded-xl transform rotate-2"></div>
                <img
                  src="/tutoriels/tuto-dashboard.png"
                  alt="Dashboard Preview"
                  className="relative rounded-lg shadow-lg border border-border bg-card"
                  onError={(e) => { e.currentTarget.src = "/hero.png" }} // Fallback
                />
              </div>
              <div className="space-y-8">
                <h2 className="text-3xl font-bold tracking-tighter text-foreground">
                  Comment ça marche ?
                </h2>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-none w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                    <div>
                      <h4 className="text-lg font-semibold mb-1 text-foreground">Importez ou Créez</h4>
                      <p className="text-muted-foreground">Uploadez vos fichiers existants ou partez de zéro avec nos modèles de cours (Cours Magistral, TD, TP...).</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-none w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                    <div>
                      <h4 className="text-lg font-semibold mb-1 text-foreground">Enrichissez et Personnalisez</h4>
                      <p className="text-muted-foreground">Utilisez l'éditeur pour ajouter des images, des vidéos et structurer votre contenu pour une pédagogie optimale.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-none w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                    <div>
                      <h4 className="text-lg font-semibold mb-1 text-foreground">Publiez et Analysez</h4>
                      <p className="text-muted-foreground">Rendez le cours accessible aux étudiants et observez leurs progrès en temps réel via le dashboard.</p>
                    </div>
                  </div>
                </div>

                <Button className="mt-4" asChild>
                  <Link href="/inscription">
                    Créer mon premier cours <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6">
              Prêt à transformer votre enseignement ?
            </h2>
            <p className="text-primary-foreground/90 md:text-xl max-w-[600px] mx-auto mb-10">
              Rejoignez des centaines d'enseignants qui utilisent XCSM pour gagner du temps et engager leurs étudiants.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-primary font-bold" asChild>
                <Link href="/inscription">Commencer l'essai gratuit</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" asChild>
                <Link href="/contact">Nous contacter</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
