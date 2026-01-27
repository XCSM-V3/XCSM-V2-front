import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"

export default function TarifsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Nos tarifs</h1>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Choisissez le plan qui correspond à vos besoins
                </p>
              </div>
            </div>

            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 mt-12">
              {/* Plan Gratuit */}
              <div className="flex flex-col rounded-lg border border-green-100 p-6 shadow-sm">
                <div className="mb-5">
                  <h3 className="text-lg font-bold">Gratuit</h3>
                  <p className="text-sm text-gray-500 mt-1">Pour les enseignants individuels</p>
                </div>
                <div className="mb-5">
                  <span className="text-3xl font-bold">0€</span>
                  <span className="text-sm text-gray-500">/mois</span>
                </div>
                <ul className="mb-6 space-y-2 text-sm">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    <span>Jusqu'à 5 documents</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    <span>Modèles de base</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    <span>Partage limité</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    <span>Stockage 100 Mo</span>
                  </li>
                </ul>
                <Button asChild className="mt-auto bg-green-600 hover:bg-green-700">
                  <Link href="/inscription">Commencer gratuitement</Link>
                </Button>
              </div>

              {/* Plan Standard */}
              <div className="flex flex-col rounded-lg border border-green-600 p-6 shadow-md relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Populaire
                </div>
                <div className="mb-5">
                  <h3 className="text-lg font-bold">Standard</h3>
                  <p className="text-sm text-gray-500 mt-1">Pour les enseignants actifs</p>
                </div>
                <div className="mb-5">
                  <span className="text-3xl font-bold">9,99€</span>
                  <span className="text-sm text-gray-500">/mois</span>
                </div>
                <ul className="mb-6 space-y-2 text-sm">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    <span>Documents illimités</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    <span>Tous les modèles</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    <span>Partage avancé</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    <span>Stockage 5 Go</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    <span>Quiz et exercices interactifs</span>
                  </li>
                </ul>
                <Button asChild className="mt-auto bg-green-600 hover:bg-green-700">
                  <Link href="/inscription?plan=standard">S'abonner</Link>
                </Button>
              </div>

              {/* Plan Premium */}
              <div className="flex flex-col rounded-lg border border-green-100 p-6 shadow-sm">
                <div className="mb-5">
                  <h3 className="text-lg font-bold">Premium</h3>
                  <p className="text-sm text-gray-500 mt-1">Pour les établissements</p>
                </div>
                <div className="mb-5">
                  <span className="text-3xl font-bold">24,99€</span>
                  <span className="text-sm text-gray-500">/mois</span>
                </div>
                <ul className="mb-6 space-y-2 text-sm">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    <span>Tout ce qui est inclus dans Standard</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    <span>Jusqu'à 10 utilisateurs</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    <span>Stockage 20 Go</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    <span>Statistiques avancées</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    <span>Support prioritaire</span>
                  </li>
                </ul>
                <Button asChild className="mt-auto bg-green-600 hover:bg-green-700">
                  <Link href="/inscription?plan=premium">Contacter les ventes</Link>
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
