"use client"

import { useState } from "react"
import { Check, X, HelpCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Option {
    id: string
    text: string
    isCorrect: boolean
}

interface QCMProps {
    qcm: {
        id: string
        question: string
        options: Option[]
        type: "single" | "multiple"
        explanation?: string
        sectionId?: string
    }
}

export function CourseQCM({ qcm }: QCMProps) {
    const [selectedOptions, setSelectedOptions] = useState<string[]>([])
    const [isSubmitted, setIsSubmitted] = useState(false)

    const isMultiple = qcm.type === "multiple"

    const handleOptionSelect = (optionId: string) => {
        if (isSubmitted) return

        if (isMultiple) {
            setSelectedOptions((prev) =>
                prev.includes(optionId)
                    ? prev.filter((id) => id !== optionId)
                    : [...prev, optionId]
            )
        } else {
            setSelectedOptions([optionId])
        }
    }

    const handleSubmit = () => {
        if (selectedOptions.length === 0) return
        setIsSubmitted(true)
    }

    const handleReset = () => {
        setSelectedOptions([])
        setIsSubmitted(false)
    }

    // Vérifier si la réponse est correcte
    const correctOptionIds = qcm.options.filter(opt => opt.isCorrect).map(opt => opt.id)

    const isCorrect = isSubmitted && (
        isMultiple
            ? selectedOptions.length === correctOptionIds.length && selectedOptions.every(id => correctOptionIds.includes(id))
            : selectedOptions[0] === correctOptionIds[0]
    )

    return (
        <Card className={`w-full border-l-4 ${isSubmitted ? (isCorrect ? "border-l-green-500" : "border-l-red-500") : "border-l-blue-500"}`}>
            <CardHeader>
                <CardTitle className="text-lg flex items-start gap-2">
                    <HelpCircle className="h-6 w-6 text-blue-500 flex-shrink-0" />
                    <span>{qcm.question}</span>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {isMultiple ? (
                    <div className="space-y-3">
                        {qcm.options.map((option) => (
                            <div
                                key={option.id}
                                className={`flex items-center space-x-2 p-3 rounded-md border ${isSubmitted
                                        ? option.isCorrect
                                            ? "bg-green-50 border-green-200"
                                            : selectedOptions.includes(option.id)
                                                ? "bg-red-50 border-red-200"
                                                : "border-gray-100"
                                        : selectedOptions.includes(option.id)
                                            ? "border-blue-200 bg-blue-50"
                                            : "border-gray-100 hover:bg-gray-50"
                                    } cursor-pointer transition-colors`}
                                onClick={() => handleOptionSelect(option.id)}
                            >
                                <Checkbox
                                    id={option.id}
                                    checked={selectedOptions.includes(option.id)}
                                    disabled={isSubmitted}
                                    onCheckedChange={() => handleOptionSelect(option.id)}
                                />
                                <Label htmlFor={option.id} className="flex-grow cursor-pointer font-normal">
                                    {option.text}
                                </Label>
                                {isSubmitted && option.isCorrect && <Check className="h-4 w-4 text-green-600" />}
                                {isSubmitted && !option.isCorrect && selectedOptions.includes(option.id) && <X className="h-4 w-4 text-red-600" />}
                            </div>
                        ))}
                    </div>
                ) : (
                    <RadioGroup
                        value={selectedOptions[0]}
                        onValueChange={handleOptionSelect}
                        className="space-y-3"
                    >
                        {qcm.options.map((option) => (
                            <div
                                key={option.id}
                                className={`flex items-center space-x-2 p-3 rounded-md border ${isSubmitted
                                        ? option.isCorrect
                                            ? "bg-green-50 border-green-200"
                                            : selectedOptions.includes(option.id)
                                                ? "bg-red-50 border-red-200"
                                                : "border-gray-100"
                                        : selectedOptions.includes(option.id)
                                            ? "border-blue-200 bg-blue-50"
                                            : "border-gray-100 hover:bg-gray-50"
                                    } cursor-pointer transition-colors`}
                                onClick={() => handleOptionSelect(option.id)}
                            >
                                <RadioGroupItem value={option.id} id={option.id} disabled={isSubmitted} />
                                <Label htmlFor={option.id} className="flex-grow cursor-pointer font-normal">
                                    {option.text}
                                </Label>
                                {isSubmitted && option.isCorrect && <Check className="h-4 w-4 text-green-600" />}
                                {isSubmitted && !option.isCorrect && selectedOptions.includes(option.id) && <X className="h-4 w-4 text-red-600" />}
                            </div>
                        ))}
                    </RadioGroup>
                )}

                {isSubmitted && qcm.explanation && (
                    <Alert className={isCorrect ? "bg-green-50 text-green-800 border-green-200" : "bg-blue-50 text-blue-800 border-blue-200"}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Explication</AlertTitle>
                        <AlertDescription>
                            {qcm.explanation}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>

            <CardFooter>
                {!isSubmitted ? (
                    <Button
                        onClick={handleSubmit}
                        disabled={selectedOptions.length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                        Valider la réponse
                    </Button>
                ) : (
                    <Button
                        onClick={handleReset}
                        variant="outline"
                        className="w-full"
                    >
                        Réessayer
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
