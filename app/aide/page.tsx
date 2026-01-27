import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Link from "next/link"

export default function AidePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Centre d'aide</h1>
                <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Trouvez des réponses à vos questions et apprenez à utiliser notre plateforme
                </p>
              </div>

              <div className="w-full max-w-md">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Rechercher dans l'aide..." className="pl-8 bg-background" />
                </div>
              </div>
            </div>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Catégorie 1 */}
              <div className="rounded-lg border border-border p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Premiers pas</h2>
                <ul className="space-y-2">
                  <li>
                    <Link href="/tutoriels?tab=start" className="text-primary hover:underline">
                      Comment commencer
                    </Link>
                  </li>
                  <li>
                    <Link href="/tutoriels?tab=start" className="text-primary hover:underline">
                      S'inscrire et se connecter
                    </Link>
                  </li>
                  <li>
                    <Link href="/tutoriels?tab=start" className="text-primary hover:underline">
                      Découvrir l'interface
                    </Link>
                  </li>
                  <li>
                    <Link href="/tutoriels?tab=start" className="text-primary hover:underline">
                      Créer votre premier document
                    </Link>
                  </li>
                </ul>
                <Button variant="outline" asChild className="w-full mt-4 border-primary/20 hover:bg-primary/10 text-primary">
                  <Link href="/tutoriels?tab=start">Voir tout</Link>
                </Button>
              </div>

              {/* Catégorie 2 */}
              <div className="rounded-lg border border-border p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Utilisation de l'éditeur</h2>
                <ul className="space-y-2">
                  <li>
                    <Link href="/tutoriels?tab=editor" className="text-primary hover:underline">
                      Mise en forme du texte
                    </Link>
                  </li>
                  <li>
                    <Link href="/tutoriels?tab=editor" className="text-primary hover:underline">
                      Ajouter des images et vidéos
                    </Link>
                  </li>
                  <li>
                    <Link href="/tutoriels?tab=editor" className="text-primary hover:underline">
                      Créer des tableaux
                    </Link>
                  </li>
                  <li>
                    <Link href="/tutoriels?tab=ai" className="text-primary hover:underline">
                      Intégrer des quiz IA
                    </Link>
                  </li>
                </ul>
                <Button variant="outline" asChild className="w-full mt-4 border-primary/20 hover:bg-primary/10 text-primary">
                  <Link href="/tutoriels?tab=editor">Voir tout</Link>
                </Button>
              </div>

              {/* Catégorie 3 */}
              <div className="rounded-lg border border-border p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Partage et collaboration</h2>
                <ul className="space-y-2">
                  <li>
                    <Link href="/tutoriels?tab=students" className="text-primary hover:underline">
                      Partager un document
                    </Link>
                  </li>
                  <li>
                    <Link href="/tutoriels?tab=students" className="text-primary hover:underline">
                      Gérer les permissions
                    </Link>
                  </li>
                  <li>
                    <Link href="/tutoriels?tab=students" className="text-primary hover:underline">
                      Utiliser les commentaires
                    </Link>
                  </li>
                  <li>
                    <Link href="/tutoriels?tab=students" className="text-primary hover:underline">
                      Collaboration en temps réel
                    </Link>
                  </li>
                </ul>
                <Button variant="outline" asChild className="w-full mt-4 border-primary/20 hover:bg-primary/10 text-primary">
                  <Link href="/tutoriels?tab=students">Voir tout</Link>
                </Button>
              </div>

              {/* Catégorie 4 */}
              <div className="rounded-lg border border-border p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Gestion des cours</h2>
                <ul className="space-y-2">
                  <li>
                    <Link href="/tutoriels?tab=start" className="text-primary hover:underline">
                      Créer un cours
                    </Link>
                  </li>
                  <li>
                    <Link href="/tutoriels?tab=start" className="text-primary hover:underline">
                      Organiser vos cours
                    </Link>
                  </li>
                  <li>
                    <Link href="/tutoriels?tab=students" className="text-primary hover:underline">
                      Inviter des élèves
                    </Link>
                  </li>
                  <li>
                    <Link href="/tutoriels?tab=students" className="text-primary hover:underline">
                      Suivre la progression
                    </Link>
                  </li>
                </ul>
                <Button variant="outline" asChild className="w-full mt-4 border-primary/20 hover:bg-primary/10 text-primary">
                  <Link href="/tutoriels?tab=start">Voir tout</Link>
                </Button>
              </div>

              {/* Catégorie 5 */}
              <div className="rounded-lg border border-border p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Compte et facturation</h2>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-primary hover:underline cursor-not-allowed opacity-60">
                      Gérer votre compte (Bientôt)
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-primary hover:underline cursor-not-allowed opacity-60">
                      Plans et abonnements
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-primary hover:underline cursor-not-allowed opacity-60">
                      Méthodes de paiement
                    </Link>
                  </li>
                </ul>
                <Button variant="outline" disabled className="w-full mt-4 border-primary/20 hover:bg-primary/10 text-primary">
                  Voir tout
                </Button>
              </div>

              {/* Catégorie 6 */}
              <div className="rounded-lg border border-border p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Dépannage</h2>
                <ul className="space-y-2">
                  <li>
                    <Link href="/tutoriels?tab=troubleshoot" className="text-primary hover:underline">
                      Problèmes de connexion
                    </Link>
                  </li>
                  <li>
                    <Link href="/tutoriels?tab=troubleshoot" className="text-primary hover:underline">
                      Récupération de données
                    </Link>
                  </li>
                  <li>
                    <Link href="/tutoriels?tab=troubleshoot" className="text-primary hover:underline">
                      Problèmes avec l'éditeur
                    </Link>
                  </li>
                  <li>
                    <Link href="mailto:support@studtech.fr" className="text-primary hover:underline">
                      Contacter le support
                    </Link>
                  </li>
                </ul>
                <Button variant="outline" asChild className="w-full mt-4 border-primary/20 hover:bg-primary/10 text-primary">
                  <Link href="/tutoriels?tab=troubleshoot">Voir tout</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
