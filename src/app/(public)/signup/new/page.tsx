'use client';

import Step3BusinessDetails from '@/app/(public)/signup/steps/Step3BusinessDetails';
import { Step4VolumeOperations } from '@/app/(public)/signup/steps/Step4VolumeOperations';
import { Step5OwnersRepresentatives } from '@/app/(public)/signup/steps/Step5OwnersRepresentatives';
import { Step6PEPSanctionsScreening } from '@/app/(public)/signup/steps/Step6PEPSanctionsScreening';
import { Step7DocumentUpload } from '@/app/(public)/signup/steps/Step7DocumentUpload';
import { Step8InformationSubmitted } from '@/app/(public)/signup/steps/Step8InformationSubmitted';
import { useCallback, useState } from 'react';
import { SignupStepWrapper } from '../components/SignupStepWrapper';
import { Step1AccountType } from '../steps/Step1AccountType';
import { Step2BusinessInfo } from '../steps/Step2BusinessInfo';

export default function NewSignupPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    accountType: 'business',
    // Step 2
    country: '',
    entityType: '',
    businessName: '',
    taxId: '',
    state: '',
    address: '',
    apt: '',
    city: '',
    postalCode: '',
    // Step 3
    industry: '',
    website: '',
    businessDescription: '',
    expectedMonthlyVolume: '',
    primaryUseCase: '',
    // Step 4
    volumeSwift: '',
    volumeLocal: '',
    volumeCrypto: '',
    volumeInternationalCnt: '',
    volumeLocalCnt: '',
    currencies: [],
    region: '',
    // Step 5
    ownershipPercentage: '',
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerDob: '',
    ownerCitizenship: '',
    ownerSecondaryCitizenship: '',
    ownerPercentage: '',
    ownerRole: '',
    residentialCountry: '',
    residentialAddress: '',
    residentialApt: '',
    residentialCity: '',
    residentialState: '',
    residentialPostalCode: '',
    idType: '',
    idNumber: '',
    idIssuingCountry: '',
    idIssueDate: '',
    idExpirationDate: '',
    employmentStatus: '',
    employmentIndustry: '',
    occupation: '',
    employerName: '',
    sourceOfIncome: '',
    annualIncome: '',
    // Step 6
    isPEPSeniorOfficial: null,
    isPEPPoliticalParty: null,
    isPEPFamilyMember: null,
    isPEPCloseAssociate: null,
  });

  const handleNext = () => {
    if (step < 8) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <Step1AccountType
            selectedType={formData.accountType}
            onSelect={type => updateFormData('accountType', type)}
          />
        );
      case 2:
        return <Step2BusinessInfo formData={formData} onChange={updateFormData} />;
      case 3:
        return <Step3BusinessDetails formData={formData} onChange={updateFormData} />;
      case 4:
        return <Step4VolumeOperations formData={formData} onChange={updateFormData} />;
      case 5:
        return <Step5OwnersRepresentatives formData={formData} onChange={updateFormData} />;
      case 6:
        return <Step6PEPSanctionsScreening formData={formData} onChange={updateFormData} />;
      case 7:
        return <Step7DocumentUpload formData={formData} onChange={updateFormData} sessionId={null} />;
      case 8:
        return <Step8InformationSubmitted formData={formData} onChange={updateFormData} />;
      default:
        return (
          <div className='flex h-40 items-center justify-center text-gray-500'>
            Step {step} content coming soon...
          </div>
        );
    }
  };

  const getStepConfig = () => {
    switch (step) {
      case 1:
        return {
          title: 'Choose Your Account Type',
          subtitle: "Select the type of account you'd like to open",
          showBack: false,
        };
      case 2:
        return {
          title: 'Business Information',
          subtitle: 'Enter your legal entity details',
          showBack: true,
        };
      case 3:
        return {
          title: 'Business Details',
          subtitle: 'Tell us more about your business',
          showBack: true,
        };
      case 4:
        return {
          title: 'Volume & Operations',
          subtitle: 'Tell us about expected transaction volumes and operational regions',
          showBack: true,
        };
      case 5:
        return {
          title: 'Owners & Representatives',
          subtitle: 'Tell us about your ownership and representatives',
          showBack: true,
        };
      case 6:
        return {
          title: 'PEP & Sanctions Screening',
          subtitle: 'Answer the following questions about political exposure',
          showBack: true,
        };
      case 7:
        return {
          title: 'Document Upload',
          subtitle: 'Upload required business documents',
          showBack: true,
        };
      case 8:
        return {
          title: 'Information Submitted Successfully',
          subtitle: 'Thank you for completing your onboarding',
          showBack: false,
        };
      default:
        return {
          title: 'Step ' + step,
          subtitle: 'Details for step ' + step,
          showBack: true,
        };
    }
  };

  const config = getStepConfig();

  return (
    <SignupStepWrapper
      step={step}
      totalSteps={8}
      title={config.title}
      subtitle={config.subtitle}
      onNext={handleNext}
      onBack={handleBack}
      showBack={config.showBack}
    >
      {renderStepContent()}
    </SignupStepWrapper>
  );
}
