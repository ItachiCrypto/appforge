# Fix Auth Pages - Écran Noir Résolu

## Problème
Les pages `/sign-in` et `/sign-up` affichaient un écran noir sur Vercel.

## Cause Racine
1. **`styled-jsx` dans le layout auth** - Le CSS-in-JS avec `<style jsx global>` ne fonctionne pas correctement avec Next.js App Router sur Vercel en production
2. **Conflit de styles** - Triple définition des styles Clerk (pages + layout + ClerkProvider)
3. **`"use client"` inutile** sur le layout auth

## Corrections Appliquées

### 1. `src/app/(auth)/layout.tsx`
**Avant:** Layout "use client" avec 200+ lignes de styled-jsx CSS
**Après:** Layout serveur simple avec Tailwind
```tsx
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a]">
      {children}
    </div>
  )
}
```

### 2. `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
**Avant:** "use client" avec styles d'apparence inline dupliqués
**Après:** Composant serveur minimal qui hérite des styles du ClerkProvider
```tsx
import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return <SignIn />
}
```

### 3. `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
**Avant:** "use client" avec styles d'apparence inline dupliqués
**Après:** Même simplification
```tsx
import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return <SignUp />
}
```

## Pourquoi ça fonctionne maintenant
- Le `ClerkProvider` dans `providers.tsx` définit DÉJÀ tous les styles dark mode correctement avec `baseTheme: dark` et les variables/elements personnalisés
- Plus besoin de redéfinir les styles dans chaque page
- Suppression de styled-jsx qui causait le problème de rendu sur Vercel
- Les pages sont maintenant des Server Components (plus rapides)

## Vérification
Déployer sur Vercel et vérifier que:
- [ ] `/sign-in` affiche le formulaire Clerk en mode dark
- [ ] `/sign-up` affiche le formulaire Clerk en mode dark
- [ ] Le fond est bien `#0a0a0a` (noir profond)
- [ ] Le texte est blanc/gris clair
- [ ] Les boutons violet fonctionnent
