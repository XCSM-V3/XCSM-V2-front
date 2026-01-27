import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function FonctionnalitesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Nos fonctionnalités</h1>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Découvrez les outils qui vous aideront à créer des documents pédagogiques de qualité.
                </p>
              </div>
            </div>

            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12">
              <div className="flex flex-col items-start space-y-3 rounded-lg border border-green-100 p-6 shadow-sm">
                <div className="rounded-full bg-green-100 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-green-600"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Éditeur intuitif</h3>
                <p className="text-sm text-gray-500">
                  Notre éditeur WYSIWYG vous permet de créer des documents riches sans connaissances techniques. Ajoutez
                  facilement du texte, des images, des tableaux et plus encore.
                </p>
              </div>

              <div className="flex flex-col items-start space-y-3 rounded-lg border border-green-100 p-6 shadow-sm">
                <div className="rounded-full bg-green-100 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-green-600"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Collaboration en temps réel</h3>
                <p className="text-sm text-gray-500">
                  Travaillez à plusieurs sur le même document simultanément. Voyez les modifications en temps réel et
                  communiquez avec vos collaborateurs.
                </p>
              </div>

              <div className="flex flex-col items-start space-y-3 rounded-lg border border-green-100 p-6 shadow-sm">
                <div className="rounded-full bg-green-100 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-green-600"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <path d="M12 18v-6"></path>
                    <path d="M8 15h8"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Contenu interactif</h3>
                <p className="text-sm text-gray-500">
                  Créez des quiz, des sondages et des exercices interactifs pour engager vos élèves et évaluer leur
                  compréhension.
                </p>
              </div>

              <div className="flex flex-col items-start space-y-3 rounded-lg border border-green-100 p-6 shadow-sm">
                <div className="rounded-full bg-green-100 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-green-600"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Multimédia</h3>
                <p className="text-sm text-gray-500">
                  Intégrez facilement des vidéos, des audios et d'autres médias pour créer des cours plus engageants et
                  adaptés à différents styles d'apprentissage.
                </p>
              </div>

              <div className="flex flex-col items-start space-y-3 rounded-lg border border-green-100 p-6 shadow-sm">
                <div className="rounded-full bg-green-100 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-green-600"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Sécurité et confidentialité</h3>
                <p className="text-sm text-gray-500">
                  Vos données sont sécurisées avec un chiffrement de bout en bout. Contrôlez qui peut voir et modifier
                  vos documents avec des permissions détaillées.
                </p>
              </div>

              <div className="flex flex-col items-start space-y-3 rounded-lg border border-green-100 p-6 shadow-sm">
                <div className="rounded-full bg-green-100 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-green-600"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Modèles personnalisables</h3>
                <p className="text-sm text-gray-500">
                  Commencez rapidement avec nos modèles prédéfinis ou créez les vôtres. Personnalisez-les selon vos
                  besoins et votre style d'enseignement.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
