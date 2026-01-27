"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { User, Lock, Save, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { api } from "@/lib/api"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Formulaire profil
  const [profileForm, setProfileForm] = useState({
    nom: "",
    prenom: "",
    specialite: "",
    niveau: "",
  })
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  // Formulaire mot de passe
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    new_password2: "",
  })
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const userData = await api.getCurrentUser()
      setUser(userData)
      setProfileForm({
        nom: userData.nom || "",
        prenom: userData.prenom || "",
        specialite: userData.profil?.specialite || "",
        niveau: userData.profil?.niveau || "",
      })
    } catch (error) {
      console.error("Erreur:", error)
      router.push("/login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMessage(null)
    setIsSaving(true)

    try {
      await api.updateProfile(profileForm)
      setProfileMessage({
        type: "success",
        text: "Profil mis à jour avec succès",
      })
      loadUser()
    } catch (error: any) {
      setProfileMessage({
        type: "error",
        text: error.message || "Erreur lors de la mise à jour",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (passwordForm.new_password !== passwordForm.new_password2) {
      setPasswordMessage({
        type: "error",
        text: "Les mots de passe ne correspondent pas",
      })
      return
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "Le mot de passe doit contenir au moins 8 caractères",
      })
      return
    }

    setIsSaving(true)

    try {
      await api.changePassword(
        passwordForm.old_password,
        passwordForm.new_password,
        passwordForm.new_password2
      )
      setPasswordMessage({
        type: "success",
        text: "Mot de passe modifié avec succès",
      })
      setPasswordForm({
        old_password: "",
        new_password: "",
        new_password2: "",
      })
    } catch (error: any) {
      setPasswordMessage({
        type: "error",
        text: error.message || "Erreur lors du changement de mot de passe",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mon profil</h1>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles et votre sécurité
        </p>
      </div>

      {/* Carte d'information utilisateur */}
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary rounded-full">
              <User className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">
                {user?.prenom} {user?.nom}
              </h2>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
            <Badge
              className={
                user?.role === "enseignant"
                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                  : "bg-secondary text-secondary-foreground"
              }
            >
              {user?.role === "enseignant" ? "Enseignant" : "Étudiant"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Onglets */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Informations personnelles
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="mr-2 h-4 w-4" />
            Mot de passe
          </TabsTrigger>
        </TabsList>

        {/* Onglet Profil */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Modifiez vos informations de profil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {profileMessage && (
                  <div
                    className={`flex items-center gap-3 p-4 rounded-lg border ${profileMessage.type === "success"
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                      : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                      }`}
                  >
                    {profileMessage.type === "success" ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                    <p
                      className={
                        profileMessage.type === "success"
                          ? "text-green-800 dark:text-green-200"
                          : "text-red-800 dark:text-red-200"
                      }
                    >
                      {profileMessage.text}
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      value={profileForm.prenom}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, prenom: e.target.value })
                      }
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      value={profileForm.nom}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, nom: e.target.value })
                      }
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    L'email ne peut pas être modifié
                  </p>
                </div>

                {user?.role === "enseignant" ? (
                  <div className="space-y-2">
                    <Label htmlFor="specialite">Spécialité</Label>
                    <Input
                      id="specialite"
                      placeholder="Ex: Mathématiques, Physique..."
                      value={profileForm.specialite}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          specialite: e.target.value,
                        })
                      }
                      disabled={isSaving}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="niveau">Niveau</Label>
                    <Input
                      id="niveau"
                      placeholder="Ex: Licence 3, Master 1..."
                      value={profileForm.niveau}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, niveau: e.target.value })
                      }
                      disabled={isSaving}
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Mot de passe */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Changer le mot de passe</CardTitle>
              <CardDescription>
                Assurez-vous d'utiliser un mot de passe fort
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-6">
                {passwordMessage && (
                  <div
                    className={`flex items-center gap-3 p-4 rounded-lg border ${passwordMessage.type === "success"
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                      : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                      }`}
                  >
                    {passwordMessage.type === "success" ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                    <p
                      className={
                        passwordMessage.type === "success"
                          ? "text-green-800 dark:text-green-200"
                          : "text-red-800 dark:text-red-200"
                      }
                    >
                      {passwordMessage.text}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="old_password">Mot de passe actuel</Label>
                  <Input
                    id="old_password"
                    type="password"
                    value={passwordForm.old_password}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        old_password: e.target.value,
                      })
                    }
                    disabled={isSaving}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password">Nouveau mot de passe</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        new_password: e.target.value,
                      })
                    }
                    disabled={isSaving}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Minimum 8 caractères
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password2">
                    Confirmer le nouveau mot de passe
                  </Label>
                  <Input
                    id="new_password2"
                    type="password"
                    value={passwordForm.new_password2}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        new_password2: e.target.value,
                      })
                    }
                    disabled={isSaving}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Modification...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Changer le mot de passe
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}