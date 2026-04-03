import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { Providers } from "./providers"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { AIAgentProvider } from "@/contexts/AIAgentContext"
import AIAgentModal from "@/components/ai/AIAgentModal"
import AIAgentButton from "@/components/ai/AIAgentButton"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Éditeur de Document pour Enseignants",
  description: "Interface professionnelle d'édition de documents pour enseignants",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <AIAgentProvider>
                {children}
                <AIAgentModal />
                <AIAgentButton />
              </AIAgentProvider>
            </ThemeProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}



























// import type { ReactNode } from "react"
// import "./globals.css"
// import { Inter } from "next/font/google"
// import { Providers } from "./providers"
// import { AuthProvider } from "@/contexts/auth-context"
// import { ThemeProvider } from "@/components/theme-provider"

// import { AIAgentProvider } from "@/contexts/AIAgentContext"
// import AIAgentModal from "@/components/ai/AIAgentModal"
// import AIAgentButton from "@/components/ai/AIAgentButton"

// const inter = Inter({ subsets: ["latin"] })

// export const metadata = {
//   title: "Éditeur de Document pour Enseignants",
//   description: "Interface professionnelle d'édition de documents pour enseignants",
//   generator: "v0.dev",
// }

// export default function RootLayout({
//   children,
// }: {
//   children: ReactNode
// }) {
//   return (
//     <html lang="fr" >
//       <body className={inter.className}>
//         <Providers>
//           <AuthProvider>
//             <ThemeProvider
//               attribute="class"
//               defaultTheme="system"
//               enableSystem
//               disableTransitionOnChange
//             >
//               <AIAgentProvider>
//                 {children}
//                 <AIAgentModal />
//                 <AIAgentButton />
//               </AIAgentProvider>
//             </ThemeProvider>
//           </AuthProvider>
//         </Providers>
//       </body>
//     </html>
//   )
// }















// import type { ReactNode } from "react"
// import "./globals.css"
// import { Inter } from "next/font/google"
// import { Providers } from "./providers"
// import { AuthProvider } from "@/contexts/auth-context"
// import { ThemeProvider } from "@/components/theme-provider"



// import { AIAgentProvider } from "@/contexts/AIAgentContext"
// import AIAgentModal from "@/components/ai/AIAgentModal"
// import AIAgentButton from "@/components/ai/AIAgentButton"




// const inter = Inter({ subsets: ["latin"] })

// export const metadata = {
//   title: "Éditeur de Document pour Enseignants",
//   description: "Interface professionnelle d'édition de documents pour enseignants",
//   generator: "v0.dev",
// }

// export default function RootLayout({
//   children,
// }: {
//   children: ReactNode
// }) {
//   return (
//     <html lang="fr" suppressHydrationWarning>
//       <body className={inter.className}>
//         <Providers>

//           <AuthProvider>
//             <ThemeProvider



//             <AIAgentProvider>
//               {children}
//               <AIAgentModal />
//               <AIAgentButton />
//             </AIAgentProvider>


//               attribute="class"
//               defaultTheme="system"
//               enableSystem
//               disableTransitionOnChange
//             >
//               {children}
//             </ThemeProvider>
//           </AuthProvider>
//         </Providers>
//       </body>
//     </html>
//   )
// }





















// import type { ReactNode } from "react"
// import "./globals.css"
// import { Inter } from "next/font/google"
// import { Providers } from "./providers"
// import { AuthProvider } from "@/contexts/auth-context"
// import { ThemeProvider } from "@/components/theme-provider"

// const inter = Inter({ subsets: ["latin"] })

// export const metadata = {
//   title: "Éditeur de Document pour Enseignants",
//   description: "Interface professionnelle d'édition de documents pour enseignants",
//   generator: "v0.dev",
// }

// export default function RootLayout({
//   children,
// }: {
//   children: ReactNode
// }) {
//   return (
//     <html lang="fr" suppressHydrationWarning>
//       <body className={inter.className}>
//         <Providers>
//           <AuthProvider>
//             <ThemeProvider
//               attribute="class"
//               defaultTheme="system"
//               enableSystem
//               disableTransitionOnChange
//             >
//               {children}
//             </ThemeProvider>
//           </AuthProvider>
//         </Providers>
//       </body>
//     </html>
//   )
// }
