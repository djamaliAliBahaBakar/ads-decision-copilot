'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignOutButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LogOut } from 'lucide-react'
import OnboardingStep1 from '@/components/onboarding/step1-upload'
import SetupPerformance from '@/components/onboarding/setup-performance'
import OnboardingStep2 from '@/components/onboarding/step2-tour'

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedData, setUploadedData] = useState<any>(null)
  const router = useRouter()
  const { user } = useUser()

  const totalSteps = 3 // Upload → Setup Performance → Tour

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
      // MVP: Créer les règles par défaut automatiquement
      await fetch('/api/onboarding/create-default-rules', { method: 'POST' })

      // Marquer onboarding comme complété
      await fetch('/api/onboarding/complete', { method: 'POST' })

      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      // Continuer quand même
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {/* Bouton déconnexion en haut à droite */}
      <div className="absolute top-4 right-4">
        <SignOutButton redirectUrl="/sign-in">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </SignOutButton>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header - Masqué sur Setup Performance qui a son propre header */}
        {currentStep !== 2 && (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Bienvenue{user?.firstName ? ` ${user.firstName}` : ''} !</h1>
            <p className="text-gray-600">
              Configurons ton Ads Decision en 2 minutes
            </p>
          </div>
        )}

        {/* Progress Bar */}
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

        {/* Step Content */}
        <Card className={`mb-6 ${currentStep === 2 ? 'p-4 md:p-8 bg-gradient-to-br from-slate-50 via-white to-slate-100' : 'p-8'}`}>
          {currentStep === 1 && (
            <OnboardingStep1
              onComplete={(data) => {
                setUploadedData(data)
                handleNext()
              }}
            />
          )}

          {currentStep === 2 && (
            <SetupPerformance
              uploadedData={uploadedData}
              onComplete={handleNext}
            />
          )}

          {currentStep === 3 && (
            <OnboardingStep2 onComplete={handleComplete} />
          )}
        </Card>

        {/* Navigation Buttons - Masqué sur l'étape Setup Performance (a son propre CTA) */}
        {currentStep !== 2 && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Précédent
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext} disabled={currentStep === 1}>
                Suivant
              </Button>
            ) : (
              <Button onClick={handleComplete}>Terminer</Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
