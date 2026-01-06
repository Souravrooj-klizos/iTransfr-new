'use client';

import { useToast } from '@/components/ui/Toast';
import { adminClientApi } from '@/lib/api/admin-client';
import { Building2, CheckCircle, FileText, Globe, Shield, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Step8Props {
  formData?: any;
  onChange?: (field: string, value: any) => void;
  errors?: Record<string, string>;
  sessionId?: string | null;
}

interface ApiData {
  owners?: Array<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: string;
    ownershipPercentage?: number;
    citizenship?: string;
    dateOfBirth?: string;
  }>;
  documents?: Array<{
    type?: string;
    fileName?: string;
    fileSize?: number;
    uploadedAt?: string;
  }>;
  businessInfo?: {
    businessName?: string;
    entityType?: string;
    taxId?: string;
    country?: string;
    address?: {
      streetAddress?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  businessDetails?: {
    industry?: string;
    website?: string;
    businessDescription?: string;
    expectedMonthlyVolume?: string;
    primaryUseCase?: string;
  };
  businessOperations?: {
    regions?: string[];
    currencies?: string[];
    volumeSwift?: string;
    volumeLocal?: string;
    volumeCrypto?: string;
    volumeFiatConversion?: string;
    volumeInternationalCnt?: string;
    volumeLocalCnt?: string;
  };
  pepResponses?: {
    pep_political?: boolean;
    pep_government?: boolean;
    pep_public_office?: boolean;
    pep_family?: boolean;
    pep_associate?: boolean;
    sanctions_subject?: boolean;
    fund_origin_confirmation?: boolean;
  };
}

export function Step8InformationSubmitted({
  formData = {},
  onChange,
  errors = {},
  sessionId,
}: Step8Props) {
  const toast = useToast();
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedRef = useRef(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId || hasFetchedRef.current || fetchingRef.current) return;

      fetchingRef.current = true;
      setIsLoading(true);
      try {
        const response = await adminClientApi.getStep1(sessionId);
        if (response.data) {
          setApiData(response.data);
          hasFetchedRef.current = true;
        }
      } catch (error: any) {
        console.error('Error fetching step 8 data:', error);
        toast.error('Error', 'Failed to load submission details');
      } finally {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchData();
  }, [sessionId]); // Removed toast from dependencies

  // Reset fetch flag when sessionId changes
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [sessionId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDocumentType = (type?: string) => {
    if (!type) return 'Unknown';
    return type
      .split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className='space-y-8'>
      {/* Warning Notice Section */}
      <section className='space-y-4'>
        <div className='inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1'>
          <div className='h-2 w-2 rounded-full bg-orange-500' />
          <span className='text-[11px] font-bold tracking-wide text-orange-400 uppercase'>
            COMPLIANCE VERIFICATION IN PROGRESS
          </span>
        </div>

        <p className='text-sm leading-relaxed text-gray-900'>
          We are now reviewing your information and documents as part of our compliance and
          verification process. This review is required before your account can be activated.
        </p>

        <div className='space-y-3 pt-2'>
          <h4 className='text-sm font-medium text-gray-900'>What to expect next:</h4>
          <ul className='space-y-2 pl-1'>
            <li className='flex items-center gap-2 text-sm text-gray-700'>
              <span className='h-1 w-1 rounded-full bg-gray-400' />
              Our compliance team will review your submission
            </li>
            <li className='flex items-center gap-2 text-sm text-gray-700'>
              <span className='h-1 w-1 rounded-full bg-gray-400' />
              Additional information may be requested if needed
            </li>
            <li className='flex items-center gap-2 text-sm text-gray-700'>
              <span className='h-1 w-1 rounded-full bg-gray-400' />
              You will be notified by email once the review is complete
            </li>
          </ul>
        </div>

        <p className='text-sm text-gray-800'>
          Typical review time: <span className='font-medium'>1–3 business days</span>.{' '}
          <span className='text-gray-500'>(Some applications may require additional review.)</span>
        </p>
      </section>

      {/* Submission Summary */}
      {isLoading ? (
        <div className='flex items-center justify-center py-8'>
          <div className='text-sm text-gray-500'>Loading submission details...</div>
        </div>
      ) : apiData ? (
        <div className='space-y-6 border-t border-gray-200 pt-6'>
          {/* Business Information */}
          {apiData.businessInfo && (
            <section className='rounded-lg border border-gray-200 bg-white p-5'>
              <div className='mb-4 flex items-center gap-2'>
                <Building2 className='h-5 w-5 text-blue-600' />
                <h3 className='text-base font-semibold text-gray-900'>Business Information</h3>
              </div>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                  <p className='text-xs text-gray-500'>Business Name</p>
                  <p className='text-sm font-medium text-gray-900'>
                    {apiData.businessInfo.businessName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Entity Type</p>
                  <p className='text-sm font-medium text-gray-900'>
                    {apiData.businessInfo.entityType?.toUpperCase() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Tax ID</p>
                  <p className='text-sm font-medium text-gray-900'>
                    {apiData.businessInfo.taxId || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Country</p>
                  <p className='text-sm font-medium text-gray-900'>
                    {apiData.businessInfo.country || apiData.businessInfo.address?.country || 'N/A'}
                  </p>
                </div>
                {apiData.businessInfo.address && (
                  <div className='md:col-span-2'>
                    <p className='text-xs text-gray-500'>Address</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {[
                        apiData.businessInfo.address.streetAddress,
                        apiData.businessInfo.address.addressLine2,
                        apiData.businessInfo.address.city,
                        apiData.businessInfo.address.state,
                        apiData.businessInfo.address.postalCode,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Owner Information */}
          {apiData.owners && apiData.owners.length > 0 && (
            <section className='rounded-lg border border-gray-200 bg-white p-5'>
              <div className='mb-4 flex items-center gap-2'>
                <Users className='h-5 w-5 text-blue-600' />
                <h3 className='text-base font-semibold text-gray-900'>
                  Owner Information ({apiData.owners.length})
                </h3>
              </div>
              <div className='space-y-4'>
                {apiData.owners.map((owner, index) => (
                  <div key={index} className='rounded-md border border-gray-100 bg-gray-50 p-4'>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <div>
                        <p className='text-xs text-gray-500'>Name</p>
                        <p className='text-sm font-medium text-gray-900'>
                          {owner.firstName && owner.lastName
                            ? `${owner.firstName} ${owner.lastName}`
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs text-gray-500'>Role</p>
                        <p className='text-sm font-medium text-gray-900'>
                          {owner.role
                            ? owner.role.charAt(0).toUpperCase() + owner.role.slice(1)
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs text-gray-500'>Email</p>
                        <p className='text-sm font-medium text-gray-900'>{owner.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className='text-xs text-gray-500'>Phone</p>
                        <p className='text-sm font-medium text-gray-900'>{owner.phone || 'N/A'}</p>
                      </div>
                      {owner.ownershipPercentage !== undefined && (
                        <div>
                          <p className='text-xs text-gray-500'>Ownership Percentage</p>
                          <p className='text-sm font-medium text-gray-900'>
                            {owner.ownershipPercentage}%
                          </p>
                        </div>
                      )}
                      {owner.citizenship && (
                        <div>
                          <p className='text-xs text-gray-500'>Citizenship</p>
                          <p className='text-sm font-medium text-gray-900'>{owner.citizenship}</p>
                        </div>
                      )}
                      {owner.dateOfBirth && (
                        <div>
                          <p className='text-xs text-gray-500'>Date of Birth</p>
                          <p className='text-sm font-medium text-gray-900'>
                            {formatDate(owner.dateOfBirth)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Documents Submitted */}
          {apiData.documents && apiData.documents.length > 0 && (
            <section className='rounded-lg border border-gray-200 bg-white p-5'>
              <div className='mb-4 flex items-center gap-2'>
                <FileText className='h-5 w-5 text-blue-600' />
                <h3 className='text-base font-semibold text-gray-900'>
                  Documents Submitted ({apiData.documents.length})
                </h3>
              </div>
              <div className='space-y-2'>
                {apiData.documents.map((doc, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 p-3'
                  >
                    <div className='flex items-center gap-3'>
                      <CheckCircle className='h-4 w-4 text-green-600' />
                      <div>
                        <p className='text-sm font-medium text-gray-900'>
                          {doc.fileName || formatDocumentType(doc.type)}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {formatDocumentType(doc.type)} • {formatFileSize(doc.fileSize)} •{' '}
                          {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Business Details */}
          {apiData.businessDetails && (
            <section className='rounded-lg border border-gray-200 bg-white p-5'>
              <div className='mb-4 flex items-center gap-2'>
                <Building2 className='h-5 w-5 text-blue-600' />
                <h3 className='text-base font-semibold text-gray-900'>Business Details</h3>
              </div>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {apiData.businessDetails.industry && (
                  <div>
                    <p className='text-xs text-gray-500'>Industry</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {apiData.businessDetails.industry
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </p>
                  </div>
                )}
                {apiData.businessDetails.website && (
                  <div>
                    <p className='text-xs text-gray-500'>Website</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {apiData.businessDetails.website}
                    </p>
                  </div>
                )}
                {apiData.businessDetails.primaryUseCase && (
                  <div>
                    <p className='text-xs text-gray-500'>Primary Use Case</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {apiData.businessDetails.primaryUseCase
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </p>
                  </div>
                )}
                {apiData.businessDetails.expectedMonthlyVolume && (
                  <div>
                    <p className='text-xs text-gray-500'>Expected Monthly Volume</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {apiData.businessDetails.expectedMonthlyVolume}
                    </p>
                  </div>
                )}
                {apiData.businessDetails.businessDescription && (
                  <div className='md:col-span-2'>
                    <p className='text-xs text-gray-500'>Business Description</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {apiData.businessDetails.businessDescription}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Business Operations */}
          {apiData.businessOperations && (
            <section className='rounded-lg border border-gray-200 bg-white p-5'>
              <div className='mb-4 flex items-center gap-2'>
                <Globe className='h-5 w-5 text-blue-600' />
                <h3 className='text-base font-semibold text-gray-900'>Business Operations</h3>
              </div>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {apiData.businessOperations.regions &&
                  apiData.businessOperations.regions.length > 0 && (
                    <div>
                      <p className='text-xs text-gray-500'>Operating Regions</p>
                      <p className='text-sm font-medium text-gray-900'>
                        {apiData.businessOperations.regions.map(r => r.toUpperCase()).join(', ')}
                      </p>
                    </div>
                  )}
                {apiData.businessOperations.currencies &&
                  apiData.businessOperations.currencies.length > 0 && (
                    <div>
                      <p className='text-xs text-gray-500'>Currencies</p>
                      <p className='text-sm font-medium text-gray-900'>
                        {apiData.businessOperations.currencies.join(', ')}
                      </p>
                    </div>
                  )}
                {apiData.businessOperations.volumeSwift && (
                  <div>
                    <p className='text-xs text-gray-500'>SWIFT/Wire Volume</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {apiData.businessOperations.volumeSwift.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
                {apiData.businessOperations.volumeLocal && (
                  <div>
                    <p className='text-xs text-gray-500'>Local Payments Volume</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {apiData.businessOperations.volumeLocal.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
                {apiData.businessOperations.volumeCrypto && (
                  <div>
                    <p className='text-xs text-gray-500'>Crypto Volume</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {apiData.businessOperations.volumeCrypto.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
                {apiData.businessOperations.volumeInternationalCnt && (
                  <div>
                    <p className='text-xs text-gray-500'>International Transactions</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {apiData.businessOperations.volumeInternationalCnt.replace(/_/g, ' ')} per
                      month
                    </p>
                  </div>
                )}
                {apiData.businessOperations.volumeLocalCnt && (
                  <div>
                    <p className='text-xs text-gray-500'>Local Transactions</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {apiData.businessOperations.volumeLocalCnt.replace(/_/g, ' ')} per month
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* PEP/Sanctions Responses */}
          {apiData.pepResponses && (
            <section className='rounded-lg border border-gray-200 bg-white p-5'>
              <div className='mb-4 flex items-center gap-2'>
                <Shield className='h-5 w-5 text-blue-600' />
                <h3 className='text-base font-semibold text-gray-900'>PEP & Sanctions Screening</h3>
              </div>
              <div className='space-y-2'>
                {Object.entries(apiData.pepResponses).map(([key, value]) => (
                  <div
                    key={key}
                    className='flex items-center justify-between rounded-md bg-gray-50 p-3'
                  >
                    <p className='text-sm text-gray-700'>
                      {key
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        value ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {value ? 'Yes' : 'No'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : null}
    </div>
  );
}
