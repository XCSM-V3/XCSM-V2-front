import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export default function FAQPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1 container py-12">
                <h1 className="text-4xl font-bold mb-8 text-center">Foire Aux Questions</h1>

                <div className="max-w-3xl mx-auto">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Comment créer mon premier cours ?</AccordionTrigger>
                            <AccordionContent>
                                Rendez-vous dans votre tableau de bord, cliquez sur "Nouveau Cours" ou "M'envoyer vers l'éditeur". Vous pourrez ensuite importer un PDF ou commencer votre rédaction directement.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2">
                            <AccordionTrigger>Puis-je importer des fichiers Word ?</AccordionTrigger>
                            <AccordionContent>
                                Oui, l'importation de fichiers .docx est supportée. Le système extraira le texte et tentera de conserver la structure des titres.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3">
                            <AccordionTrigger>Comment générer des QCM automatiquement ?</AccordionTrigger>
                            <AccordionContent>
                                Dans l'éditeur, sélectionnez une section de texte ou un bloc "titre", cliquez sur l'icône "Étincelle" (IA) qui apparaît, et choisissez "Générer un QCM". L'IA vous proposera plusieurs questions basées sur ce contenu.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-4">
                            <AccordionTrigger>Mes données sont-elles sécurisées ?</AccordionTrigger>
                            <AccordionContent>
                                Absolument. Nous utilisons des protocoles de chiffrement standards et vos données ne sont jamais partagées à des tiers commerciaux sans votre consentement.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-5">
                            <AccordionTrigger>Est-ce gratuit ?</AccordionTrigger>
                            <AccordionContent>
                                Nous proposons une offre gratuite pour les enseignants individuels. Des offres établissement avec fonctionnalités avancées sont disponibles sur demande.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </main>
            <SiteFooter />
        </div>
    )
}
