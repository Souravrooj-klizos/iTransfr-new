/**
 * Client Onboarding Modal Wrapper
 *
 * Handles session persistence and resume functionality for the onboarding modal.
 * Automatically saves sessionId to localStorage and resumes on modal open.
 */

'use client';

import { Modal } from '@/components/ui/Modal';
import { OnboardingStepSkeleton } from '@/components/ui/SkeletonLoader';
import { useClientOnboarding } from '@/hooks/useClientOnboarding';
import { useEffect } from 'react';

interface ClientOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  renderStep: (props: {
    currentStep: number;
    formData: any;
    validationErrors: Record<string, string>;
    updateFormData: (field: string, value: any) => void;
    onNext: () => Promise<void>;
    onBack: () => Promise<void>;
    isSubmitting: boolean;
  }) => React.ReactNode;
}

const STORAGE_KEY = 'onboarding_session_id';

export function ClientOnboardingModal({
  isOpen,
  onClose,
  onComplete,
  renderStep,
}: ClientOnboardingModalProps) {
  const {
    currentStep,
    sessionId,
    isSubmitting,
    isLoadingSession,
    isLoadingStepData,
    validationErrors,
    formData,
    updateFormData,
    goToNextStep,
    goToPreviousStep,
    resetOnboarding,
    resumeSession,
    setSessionId: setHookSessionId,
  } = useClientOnboarding({
    mode: 'admin',
    onSessionCreated: (newSessionId) => {
      // Save to localStorage when session is created
      localStorage.setItem(STORAGE_KEY, newSessionId);
    },
    onComplete: () => {
      // Clear localStorage and notify parent
      localStorage.removeItem(STORAGE_KEY);
      onComplete?.();
    },
  })

  // Save sessionId to localStorage whenever it changes
  useEffect(() => {
    if (sessionId) {
      console.log('💾 Saving sessionId to localStorage:', sessionId);
      localStorage.setItem(STORAGE_KEY, sessionId);
    }
  }, [sessionId]);

  // Resume session when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedSessionId = localStorage.getItem(STORAGE_KEY);
      if (savedSessionId && savedSessionId !== sessionId) {
        console.log('🔄 Resuming session from localStorage:', savedSessionId);
        resumeSession(savedSessionId);
      }
    }
  }, [isOpen, sessionId, resumeSession]);

  // Handle modal close
  const handleClose = () => {
    // Keep session in localStorage for resume
    onClose();
  };

  // Handle complete reset (when user explicitly wants to start fresh)
  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    resetOnboarding();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <div className="p-6">
        {isLoadingSession ? (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Loading your progress...</h3>
              <p className="text-sm text-gray-600">Please wait while we retrieve your data</p>
            </div>
            <OnboardingStepSkeleton />
          </div>
        ) : isLoadingStepData ? (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Loading step data...</h3>
            </div>
            <OnboardingStepSkeleton />
          </div>
        ) : (
          renderStep({
            currentStep,
            formData,
            validationErrors,
            updateFormData,
            onNext: goToNextStep,
            onBack: goToPreviousStep,
            isSubmitting,
          })
        )}
      </div>
    </Modal>
  );
}
