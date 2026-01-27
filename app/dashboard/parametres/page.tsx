"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

export default function ParametresPage() {
  const { user, updateProfile, isLoading } = useAuth()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [school, setSchool] = useState("")
  const [notifications, setNotifications] = useState(true)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.prenom || user.nom || "")
      setEmail(user.email || "")
      // school is not in the base user model but might be in the profile
    }
  }, [user])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateProfile({ name })
  }

  const handlePreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // The theme is already handled by useTheme and the switch onCheckedChange
    toast({
      title: "Préférences enregistrées",
      description: "Vos préférences ont été mises à jour avec succès.",
    })
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les nouveaux mots de passe ne correspondent pas.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 8 caractères.",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)
    try {
      // TODO: Implémenter l'appel API pour changer le mot de passe
      // await api.changePassword(currentPassword, newPassword)

      // Simuler un délai d'API
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été changé avec succès.",
      })

      // Réinitialiser les champs
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de changer le mot de passe.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Paramètres</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="preferences">Préférences</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="border border-green-100">
            <CardHeader>
              <CardTitle>Profil</CardTitle>
              <CardDescription>Gérez vos informations personnelles.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-green-200 focus:border-green-300 focus:ring-green-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-green-200 focus:border-green-300 focus:ring-green-300"
                  />
                </div>

                {user.role === "enseignant" && (
                  <div className="space-y-2">
                    <Label htmlFor="school">Établissement</Label>
                    <Input
                      id="school"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      className="border-green-200 focus:border-green-300 focus:ring-green-300"
                    />
                  </div>
                )}

                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
                  {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card className="border border-green-100">
            <CardHeader>
              <CardTitle>Préférences</CardTitle>
              <CardDescription>Personnalisez votre expérience.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePreferencesSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Notifications</Label>
                    <p className="text-sm text-gray-500">Recevoir des notifications par email</p>
                  </div>
                  <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">Mode sombre</Label>
                    <p className="text-sm text-gray-500">Activer le thème sombre</p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={theme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                  />
                </div>

                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Enregistrer les préférences
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border border-green-100">
            <CardHeader>
              <CardTitle>Sécurité</CardTitle>
              <CardDescription>Gérez vos paramètres de sécurité.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Mot de passe actuel</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="border-green-200 focus:border-green-300 focus:ring-green-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border-green-200 focus:border-green-300 focus:ring-green-300"
                    placeholder="Au moins 8 caractères"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-green-200 focus:border-green-300 focus:ring-green-300"
                  />
                </div>

                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? "Changement en cours..." : "Changer le mot de passe"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
