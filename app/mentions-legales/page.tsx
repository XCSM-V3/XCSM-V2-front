import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function MentionsLegalesPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1 container py-12">
                <h1 className="text-4xl font-bold mb-8">Mentions Légales</h1>

                <div className="prose max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">1. Éditeur du site</h2>
                        <p>
                            Le site XCSM est édité par la société <strong>XCSM Group</strong>,
                            société de droit camerounais immatriculée au Registre du Commerce et du Crédit Mobilier,
                            dont le siège social est situé au Cameroun.
                        </p>
                        <p className="mt-2">
                            <strong>Capital social :</strong> en Francs CFA<br />
                            <strong>Email de contact :</strong> xcsm@gmail.com
                        </p>
                    </section>


                    <section>
                        <h2 className="text-2xl font-semibold mb-4">2 Propriété intellectuelle</h2>
                        <p>
                            L'ensemble de ce site relève de la législation camerounaise et internationale sur le droit d'auteur et la propriété intellectuelle.
                            Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">3 Données personnelles</h2>
                        <p>
                            Conformément à la loi "Informatique et Libertés" et au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression des données vous concernant.
                            Pour exercer ce droit, consultez notre Politique de Confidentialité.
                        </p>
                    </section>
                </div>
            </main>
            <SiteFooter />
        </div>
    )
}
