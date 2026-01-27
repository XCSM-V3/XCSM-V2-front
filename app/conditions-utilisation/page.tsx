import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function ConditionsUtilisationPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1 container py-12">
                <h1 className="text-4xl font-bold mb-8">Conditions Générales d'Utilisation (CGU)</h1>

                <div className="prose max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">1. Objet</h2>
                        <p>
                            Les présentes CGU ont pour objet de définir les modalités de mise à disposition des services du site XCSM et les conditions d'utilisation du Service par l'Utilisateur.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">2. Accès au service</h2>
                        <p>
                            Le Service est accessible gratuitement à tout Utilisateur disposant d'un accès à internet. Tous les frais supportés pour l'accès au Service (matériel informatique, logiciels, connexion Internet, etc.) sont à la charge de l'Utilisateur.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">3. Responsabilité de l'Utilisateur</h2>
                        <p>
                            L'Utilisateur est responsable des contenus qu'il publie sur la plateforme (cours, commentaires, fichiers). Il s'engage à ne pas publier de contenus contraires aux lois en vigueur, diffamatoires, ou portant atteinte aux droits de tiers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">4. Propriété intellectuelle des contenus</h2>
                        <p>
                            L'Utilisateur conserve la propriété intellectuelle des contenus qu'il crée. En les publiant sur la plateforme, il accorde à XCSM une licence d'hébergement et de diffusion dans le cadre strict du service fourni.
                        </p>
                    </section>
                </div>
            </main>
            <SiteFooter />
        </div>
    )
}
