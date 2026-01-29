'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignOutButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LogOut } from 'lucide-react'

// Step components
import Step1ValuePreview from '@/components/onboarding/step1-value-preview'
import OnboardingUpload from '@/components/onboarding/step1-upload'
import SetupPerformance from '@/components/onboarding/setup-performance'
import OnboardingTour from '@/components/onboarding/step2-tour'

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedData, setUploadedData] = useState<any>(null)
  const router = useRouter()
  const { user } = useUser()

  // Nouveau flow: Hook → Upload → Reveal → Tour
  const totalSteps = 4

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    try {
      // Créer les règles par défaut automatiquement
      await fetch('/api/onboarding/create-default-rules', { method: 'POST' })

      // Marquer onboarding comme complété
      await fetch('/api/onboarding/complete', { method: 'POST' })

      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      router.push('/dashboard')
    }
  }

  // Déterminer si on affiche la progress bar et le header
  const showProgressBar = currentStep !== 1 && currentStep !== 3
  const showHeader = currentStep === 2 // Seulement sur l'upload
  const isFullWidthStep = currentStep === 1 || currentStep === 3

  // Déterminer le background selon l'étape
  const getStepBackground = () => {
    if (currentStep === 1 || currentStep === 3) {
      return 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
    }
    return 'bg-gray-50'
  }

  return (
    <div className={`min-h-screen ${getStepBackground()} py-8 md:py-12 px-4`}>
      {/* Bouton déconnexion en haut à droite */}
      <div className="absolute top-4 right-4 z-10">
        <SignOutButton redirectUrl="/sign-in">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </SignOutButton>
      </div>

      <div className="max-w-4xl mx-auto">

        {/* Header - Seulement sur certaines étapes */}
        {showHeader && (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Bienvenue{user?.firstName ? ` ${user.firstName}` : ''} !
            </h1>
            <p className="text-gray-600">
              Import rapide de vos données Meta Ads
            </p>
          </div>
        )}

        {/* Progress Bar - Masquée sur les écrans immersifs */}
        {showProgressBar && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Étape {currentStep} sur {totalSteps}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((currentStep / totalSteps) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step Content */}
        <Card className={`mb-6 ${isFullWidthStep ? 'p-4 md:p-8 border-0 shadow-none bg-transparent' : 'p-8'}`}>

          {/* STEP 1: Value Preview - Le Hook */}
          {currentStep === 1 && (
            <Step1ValuePreview onComplete={handleNext} />
          )}

          {/* STEP 2: Upload CSV - L'utilisateur est maintenant motivé */}
          {currentStep === 2 && (
            <OnboardingUpload
              onComplete={(data) => {
                setUploadedData(data)
                handleNext()
              }}
            />
          )}

          {/* STEP 3: Setup Performance - La Révélation avec données réelles */}
          {currentStep === 3 && (
            <SetupPerformance
              uploadedData={uploadedData}
              onComplete={handleNext}
            />
          )}

          {/* STEP 4: Tour rapide */}
          {currentStep === 4 && (
            <OnboardingTour onComplete={handleComplete} />
          )}

        </Card>

        {/* Navigation Buttons - Masqués sur les étapes immersives (1 et 3) */}
        {!isFullWidthStep && currentStep !== 4 && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep <= 1}
            >
              Précédent
            </Button>

            {currentStep < totalSteps && (
              <Button onClick={handleNext} disabled={currentStep === 2}>
                Suivant
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
