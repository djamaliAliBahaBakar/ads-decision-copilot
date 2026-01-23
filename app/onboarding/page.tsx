'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import OnboardingStep1 from '@/components/onboarding/step1-upload'
import OnboardingStep2 from '@/components/onboarding/step2-tour'
import OnboardingStep3 from '@/components/onboarding/step3-rules'
import OnboardingStep4 from '@/components/onboarding/step4-decision'

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedData, setUploadedData] = useState<any>(null)
  const router = useRouter()

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
    // Marquer onboarding comme complété
    await fetch('/api/onboarding/complete', { method: 'POST' })
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Configuration initiale</h1>
          <p className="text-gray-600">
            Configurons Ads Decision Copilot en 5 minutes
          </p>
        </div>

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
        <Card className="p-8 mb-6">
          {currentStep === 1 && (
            <OnboardingStep1
              onComplete={(data) => {
                setUploadedData(data)
                handleNext()
              }}
            />
          )}

          {currentStep === 2 && (
            <OnboardingStep2 onComplete={handleNext} />
          )}

          {currentStep === 3 && (
            <OnboardingStep3
              uploadedData={uploadedData}
              onComplete={handleNext}
            />
          )}

          {currentStep === 4 && (
            <OnboardingStep4
              uploadedData={uploadedData}
              onComplete={handleComplete}
            />
          )}
        </Card>

        {/* Navigation Buttons */}
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
      </div>
    </div>
  )
}
