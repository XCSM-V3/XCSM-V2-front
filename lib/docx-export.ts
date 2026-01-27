import { Exercise } from "./api"

/**
 * Exporte un exercice (QCM) au format DOCX.
 * Utilise html-docx-js-typescript pour la conversion.
 */
export async function exportExerciseToWord(exercise: Exercise) {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'DejaVu Sans', Arial, sans-serif; line-height: 1.6; }
            h1 { color: #166534; text-align: center; margin-bottom: 10px; }
            p.description { font-style: italic; color: #4b5563; margin-bottom: 20px; }
            .question-container { margin-bottom: 25px; page-break-inside: avoid; }
            .question-text { font-weight: bold; font-size: 1.1em; margin-bottom: 10px; }
            .option { margin-left: 20px; list-style-type: none; margin-bottom: 5px; }
            .option-box { display: inline-block; width: 12px; height: 12px; border: 1px solid #000; margin-right: 8px; }
            .feedback { margin-top: 8px; color: #666; font-size: 0.9em; font-style: italic; }
        </style>
    </head>
    <body>
        <h1>${exercise.titre}</h1>
        <p class="description">${exercise.description}</p>
        <hr />
        
        ${exercise.questions.map((q, i) => `
            <div class="question-container">
                <div class="question-text">Question ${i + 1} : ${q.enonce}</div>
                <div style="margin-left: 20px;">
                    ${q.reponses.map(r => `
                        <div class="option">
                            <span style="font-family: 'MS Gothic', 'Arial Unicode MS';">□</span> ${r.texte}
                        </div>
                    `).join('')}
                </div>
                ${q.reponses.some(r => r.feedback) ? `
                    <div class="feedback">
                        <strong>Feedback :</strong> ${q.reponses.find(r => r.feedback)?.feedback || ""}
                    </div>
                ` : ""}
            </div>
        `).join('')}
    </body>
    </html>
    `

    try {
        const { asBlob } = await import("html-docx-js-typescript")
        const blob = await asBlob(htmlContent)
        const url = URL.createObjectURL(blob as Blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${exercise.titre.replace(/\s+/g, "_")}.docx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    } catch (error) {
        console.error("Erreur lors de l'export DOCX:", error)
        throw error
    }
}

/**
 * Exporte un cours complet au format DOCX.
 */
export async function exportCourseToWord(structure: any) {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'DejaVu Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            h1 { color: #1e40af; text-align: center; margin-bottom: 30px; font-size: 2.5em; }
            h2 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-top: 40px; font-size: 2em; page-break-before: always; }
            h3 { color: #1e40af; margin-top: 30px; font-size: 1.6em; }
            h4 { color: #1d4ed8; margin-top: 20px; font-size: 1.3em; }
            h5 { color: #2563eb; margin-top: 15px; font-size: 1.1em; font-weight: bold; }
            .granule-title { color: #3b82f6; font-weight: bold; font-size: 1.1em; margin-top: 15px; border-left: 4px solid #3b82f6; padding-left: 10px; }
            .content { margin-top: 10px; margin-bottom: 30px; }
            .course-info { text-align: center; margin-bottom: 50px; color: #666; }
            .toc { margin-bottom: 50px; }
            .toc h2 { page-break-before: avoid; }
            img { max-width: 100%; height: auto; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f8fafc; color: #1e293b; }
        </style>
    </head>
    <body>
        <h1>${structure.cours.titre}</h1>
        <div class="course-info">
            <p><strong>Enseignant :</strong> ${structure.cours.enseignant}</p>
            <p>${structure.cours.description}</p>
            <p>Exporté le : ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <hr />

        ${structure.parties.map((partie: any) => `
            <div class="partie">
                <h2>Partie ${partie.numero} : ${partie.titre}</h2>
                
                ${partie.chapitres.map((chapitre: any) => `
                    <div class="chapitre">
                        <h3>Chapitre ${chapitre.numero} : ${chapitre.titre}</h3>
                        
                        ${chapitre.sections.map((section: any) => `
                            <div class="section">
                                <h4>Section ${section.numero} : ${section.titre}</h4>
                                
                                ${section.sous_sections.map((ss: any) => `
                                    <div class="sous-section">
                                        <h5>${ss.titre}</h5>
                                        
                                        ${ss.granules.map((granule: any) => `
                                            <div class="granule">
                                                <div class="granule-title">${granule.titre}</div>
                                                <div class="content">
                                                    ${granule.contenu.html_content || '<p>Pas de contenu disponible.</p>'}
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                `).join('')}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `).join('')}
    </body>
    </html>
    `

    try {
        const { asBlob } = await import("html-docx-js-typescript")
        const blob = await asBlob(htmlContent)
        const url = URL.createObjectURL(blob as Blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${structure.cours.titre.replace(/\s+/g, "_")}.docx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    } catch (error) {
        console.error("Erreur lors de l'export DOCX du cours:", error)
        throw error
    }
}
