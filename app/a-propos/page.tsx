import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AProposPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  À propos de XCSM
                </h1>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-3xl mx-auto">
                  Notre mission est de simplifier la création et le partage de documents pédagogiques pour les
                  enseignants du monde entier.
                </p>
              </div>
            </div>

            <div className="mx-auto max-w-3xl">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Notre histoire</h2>
                  <p className="text-gray-600 mb-4">
                    XCSM a été fondé en 2023 par une équipe d'anciens enseignants et de développeurs passionnés
                    par l'éducation. Nous avons constaté que les enseignants passaient trop de temps à créer et à
                    organiser leurs documents pédagogiques, et nous avons voulu leur offrir une solution simple et
                    efficace.
                  </p>
                  <p className="text-gray-600">
                    Depuis notre lancement, nous avons aidé des milliers d'enseignants à créer des documents
                    pédagogiques de qualité, à les partager avec leurs élèves et à collaborer avec leurs collègues.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4">Notre mission</h2>
                  <p className="text-gray-600">
                    Nous croyons que les enseignants devraient pouvoir se concentrer sur ce qu'ils font de mieux :
                    enseigner. C'est pourquoi nous avons créé une plateforme qui simplifie la création et la gestion de
                    documents pédagogiques, permettant aux enseignants de gagner du temps et d'améliorer la qualité de
                    leurs cours.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4">Nos valeurs</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-lg border border-green-100 p-6">
                      <h3 className="font-bold mb-2">Simplicité</h3>
                      <p className="text-gray-600 text-sm">
                        Nous concevons nos produits pour qu'ils soient intuitifs et faciles à utiliser, même pour les
                        utilisateurs les moins technophiles.
                      </p>
                    </div>
                    <div className="rounded-lg border border-green-100 p-6">
                      <h3 className="font-bold mb-2">Innovation</h3>
                      <p className="text-gray-600 text-sm">
                        Nous cherchons constamment à améliorer notre plateforme et à intégrer les dernières technologies
                        pour offrir la meilleure expérience possible.
                      </p>
                    </div>
                    <div className="rounded-lg border border-green-100 p-6">
                      <h3 className="font-bold mb-2">Collaboration</h3>
                      <p className="text-gray-600 text-sm">
                        Nous croyons au pouvoir de la collaboration et nous concevons nos outils pour faciliter le
                        travail d'équipe entre enseignants.
                      </p>
                    </div>
                    <div className="rounded-lg border border-green-100 p-6">
                      <h3 className="font-bold mb-2">Accessibilité</h3>
                      <p className="text-gray-600 text-sm">
                        Nous nous efforçons de rendre notre plateforme accessible à tous, quels que soient leurs moyens
                        ou leurs capacités.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4">Notre équipe</h2>
                  <p className="text-gray-600 mb-6">
                    Nous sommes une équipe diversifiée d'anciens enseignants, de développeurs, de designers et de
                    spécialistes de l'éducation, tous unis par la passion de l'éducation et de la technologie.
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="text-center">
                        <div className="rounded-full bg-gray-200 w-24 h-24 mx-auto mb-3"></div>
                        <h3 className="font-bold">Nom Prénom</h3>
                        <p className="text-sm text-gray-500">Fonction</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center pt-8">
                  <h2 className="text-2xl font-bold mb-4">Rejoignez-nous</h2>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Vous êtes passionné par l'éducation et la technologie ? Rejoignez notre équipe et aidez-nous à
                    transformer la façon dont les enseignants créent et partagent leurs documents pédagogiques.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">

                    <Button variant="outline" asChild className="border-green-200 hover:bg-green-50">
                      <Link href="/contact">Nous contacter</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
