"use client"

import { useState } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface GranuleSearchBarProps {
    onSearch: (query: string) => void
    isLoading?: boolean
    placeholder?: string
}

export function GranuleSearchBar({ onSearch, isLoading = false, placeholder = "Rechercher dans les contenus..." }: GranuleSearchBarProps) {
    const [query, setQuery] = useState("")

    const handleSearch = () => {
        if (query.trim()) {
            onSearch(query.trim())
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch()
        }
    }

    return (
        <div className="flex gap-2 w-full">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10"
                    disabled={isLoading}
                />
            </div>
            <Button
                onClick={handleSearch}
                className="bg-green-600 hover:bg-green-700"
                disabled={isLoading || !query.trim()}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Recherche...
                    </>
                ) : (
                    "Rechercher"
                )}
            </Button>
        </div>
    )
}
