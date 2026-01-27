import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function PolitiqueConfidentialitePage() {
    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1 container py-12">
                <h1 className="text-4xl font-bold mb-8">Politique de Confidentialité</h1>

                <div className="prose max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">1. Collecte des données</h2>
                        <p>
                            Nous collectons les données suivantes :
                        </p>
                        <ul className="list-disc pl-6">
                            <li>Identité (Nom, Prénom, Email)</li>
                            <li>Données académiques (Rôle, Établissement, Cours suivis/créés)</li>
                            <li>Données de connexion et d'usage (Logs, adresse IP)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">2. Finalité du traitement</h2>
                        <p>
                            Vos données sont utilisées pour :
                        </p>
                        <ul className="list-disc pl-6">
                            <li>Fournir les services de la plateforme (création de cours, suivi)</li>
                            <li>Améliorer nos fonctionnalités via l'analyse d'usage</li>
                            <li>Communiquer avec vous concernant votre compte ou les nouveautés</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">3. Partage des données</h2>
                        <p>
                            Nous ne vendons pas vos données personnelles. Elles peuvent être partagées avec des sous-traitants techniques (hébergement, envoi d'email) dans le strict cadre de l'exécution du service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">4. Sécurité</h2>
                        <p>
                            Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données contre tout accès non autorisé, perte ou altération.
                        </p>
                    </section>
                </div>
            </main>
            <SiteFooter />
        </div>
    )
}
