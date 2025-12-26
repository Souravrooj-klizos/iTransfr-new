import ActivityIcon from '@/components/icons/ActivityIcon';
import { adminClientApi } from '@/lib/api/admin-client';
import { CheckCircle, Clock, Loader2, Shield, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  actionType?: string;
  target?: {
    name: string;
    link?: string;
  };
  timestamp: string;
  metadata?: {
    newValues?: {
      amlbotApplicantId?: string;
      amlbotVerificationId?: string;
      error?: string;
      documentsAttempted?: number;
    };
  };
}

interface AmlBotStatus {
  hasKycRecord: boolean;
  status?: string;
  amlbotRequestId?: string; // Verification ID
  amlbotApplicantId?: string; // Applicant ID
  riskScore?: number;
  rejectionDetails?: {
    profile?: { verified: boolean; comment?: string; decline_reasons?: string[] };
    document?: { verified: boolean; comment?: string; decline_reasons?: string[] };
  };
  createdAt?: string;
  updatedAt?: string;
}

interface ClientActivityProps {
  clientId: string;
}

export function ClientActivity({ clientId }: ClientActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [amlBotStatus, setAmlBotStatus] = useState<AmlBotStatus | null>(null);
  const [amlBotLoading, setAmlBotLoading] = useState(true);
  const LIMIT = 20;

  // Guard against duplicate fetch calls (React StrictMode)
  const hasFetched = useRef(false);

  // Fetch AMLBot/KYC status
  const fetchAmlBotStatus = useCallback(async () => {
    try {
      console.log('[ClientActivity] Fetching KYC status for client:', clientId);
      setAmlBotLoading(true);
      const response = await adminClientApi.getKYCStatus(clientId);
      console.log('[ClientActivity] KYC status response:', response);
      setAmlBotStatus(response);
    } catch (error) {
      console.error('[ClientActivity] Error fetching AMLBot status:', error);
      setAmlBotStatus(null);
    } finally {
      setAmlBotLoading(false);
    }
  }, [clientId]);

  const fetchActivity = useCallback(
    async (isLoadMore = false) => {
      try {
        if (!isLoadMore) setLoading(true);
        const response = await adminClientApi.getActivity(clientId, LIMIT, isLoadMore ? offset : 0);

        if (response.success) {
          if (isLoadMore) {
            setActivities(prev => [...prev, ...response.activities]);
            setFilteredActivities(prev => [...prev, ...response.activities]);
          } else {
            setActivities(response.activities);
            setFilteredActivities(response.activities);
          }

          setHasMore(response.count === LIMIT);
          if (isLoadMore) {
            setOffset(prev => prev + LIMIT);
          } else {
            setOffset(LIMIT);
          }
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
      }
    },
    [clientId, offset]
  );

  useEffect(() => {
    if (clientId && !hasFetched.current) {
      hasFetched.current = true;
      fetchActivity();
      fetchAmlBotStatus();
    }
  }, [clientId]);

  const handleLoadMore = () => {
    fetchActivity(true);
  };

  // Extract amlbot info from activity (check both submitted and failed)
  const getAmlBotInfoFromActivity = () => {
    // Check for successful submission
    const amlbotSubmitted = activities.find(a => a.actionType === 'amlbot_submitted');
    if (amlbotSubmitted?.metadata?.newValues) {
      return {
        applicantId: amlbotSubmitted.metadata.newValues.amlbotApplicantId,
        verificationId: amlbotSubmitted.metadata.newValues.amlbotVerificationId,
        status: 'submitted',
        error: null,
      };
    }

    // Check for failed submission
    const amlbotFailed = activities.find(a => a.actionType === 'amlbot_submission_failed');
    if (amlbotFailed?.metadata?.newValues) {
      return {
        applicantId: null,
        verificationId: null,
        status: 'failed',
        error: amlbotFailed.metadata.newValues.error,
        documentsAttempted: amlbotFailed.metadata.newValues.documentsAttempted,
      };
    }

    // Check if client was created (final step means KYC was attempted)
    const clientCreated = activities.find(a => a.actionType === 'client_created_final');
    if (clientCreated) {
      return {
        applicantId: null,
        verificationId: null,
        status: 'not_started',
        error: null,
      };
    }

    return null;
  };

  const amlBotActivityInfo = getAmlBotInfoFromActivity();

  // Status badge helper
  const getStatusBadge = (status?: string, activityInfo?: typeof amlBotActivityInfo) => {
    // Check activity info first for more specific status
    if (activityInfo?.status === 'failed') {
      return (
        <span className='inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700'>
          <XCircle className='h-3.5 w-3.5' /> Submission Failed
        </span>
      );
    }
    if (activityInfo?.status === 'not_started') {
      return (
        <span className='inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600'>
          <Clock className='h-3.5 w-3.5' /> Not Submitted
        </span>
      );
    }

    const statusLower = status?.toLowerCase() || '';

    if (statusLower === 'approved' || statusLower === 'verified' || statusLower === 'completed') {
      return (
        <span className='inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700'>
          <CheckCircle className='h-3.5 w-3.5' /> Verified
        </span>
      );
    }
    if (statusLower === 'rejected' || statusLower === 'failed') {
      return (
        <span className='inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700'>
          <XCircle className='h-3.5 w-3.5' /> Rejected
        </span>
      );
    }
    if (
      statusLower === 'pending' ||
      statusLower === 'processing' ||
      statusLower === 'in_progress'
    ) {
      return (
        <span className='inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700'>
          <Clock className='h-3.5 w-3.5' /> Pending Review
        </span>
      );
    }
    // No status or unknown - show submitted if we have activity info
    if (activityInfo?.status === 'submitted') {
      return (
        <span className='inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700'>
          <Shield className='h-3.5 w-3.5' /> Submitted
        </span>
      );
    }
    return (
      <span className='inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600'>
        <Clock className='h-3.5 w-3.5' /> Unknown
      </span>
    );
  };

  if (loading && activities.length === 0) {
    return (
      <div className='flex items-center justify-center rounded-xl border border-gray-200 bg-white p-12'>
        <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* AMLBot Verification Status Card */}
      {(amlBotStatus?.hasKycRecord || amlBotActivityInfo) && (
        <div className='rounded-xl border border-gray-200 bg-white p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100'>
                <Shield className='h-5 w-5 text-purple-600' />
              </div>
              <div>
                <h3 className='text-sm font-semibold text-gray-900'>AMLBot Verification</h3>
                <p className='text-xs text-gray-500'>KYC/AML compliance check status</p>
              </div>
            </div>
            {amlBotLoading ? (
              <Loader2 className='h-4 w-4 animate-spin text-gray-400' />
            ) : (
              getStatusBadge(amlBotStatus?.status, amlBotActivityInfo)
            )}
          </div>

          <div className='mt-4 grid grid-cols-1 gap-3 md:grid-cols-3'>
            {/* Applicant ID */}
            <div className='rounded-lg border border-gray-100 bg-gray-50 p-3'>
              <p className='text-[10px] font-medium tracking-wider text-gray-400 uppercase'>
                Applicant ID
              </p>
              <p
                className='mt-1 truncate text-xs font-medium text-gray-700'
                title={
                  amlBotStatus?.amlbotApplicantId || amlBotActivityInfo?.applicantId || undefined
                }
              >
                {amlBotStatus?.amlbotApplicantId || amlBotActivityInfo?.applicantId || 'N/A'}
              </p>
            </div>

            {/* Verification ID */}
            <div className='rounded-lg border border-gray-100 bg-gray-50 p-3'>
              <p className='text-[10px] font-medium tracking-wider text-gray-400 uppercase'>
                Verification ID
              </p>
              <p
                className='mt-1 truncate text-xs font-medium text-gray-700'
                title={amlBotActivityInfo?.verificationId || undefined}
              >
                {amlBotActivityInfo?.verificationId || 'N/A'}
              </p>
            </div>

            {/* Risk Score */}
            {amlBotStatus?.riskScore !== undefined && (
              <div className='rounded-lg border border-gray-100 bg-gray-50 p-3'>
                <p className='text-[10px] font-medium tracking-wider text-gray-400 uppercase'>
                  Risk Score
                </p>
                <p className='mt-1 text-xs font-medium text-gray-700'>{amlBotStatus.riskScore}</p>
              </div>
            )}
          </div>

          {/* Rejection Details */}
          {amlBotStatus?.status === 'rejected' && amlBotStatus?.rejectionDetails && (
            <div className='mt-4 space-y-3'>
              <h4 className='text-sm font-medium text-gray-900'>Rejection Details</h4>

              {/* Profile Verification */}
              {amlBotStatus.rejectionDetails.profile && (
                <div className='rounded-lg border border-red-200 bg-red-50 p-3'>
                  <div className='mb-2 flex items-center gap-2'>
                    <div className='h-2 w-2 rounded-full bg-red-500'></div>
                    <p className='text-xs font-medium text-red-800'>Profile Verification</p>
                  </div>
                  {amlBotStatus.rejectionDetails.profile.comment && (
                    <p className='mb-2 text-xs text-red-700'>
                      {amlBotStatus.rejectionDetails.profile.comment}
                    </p>
                  )}
                  {amlBotStatus.rejectionDetails.profile.decline_reasons &&
                    amlBotStatus.rejectionDetails.profile.decline_reasons.length > 0 && (
                      <div className='space-y-1'>
                        <p className='text-xs font-medium text-red-800'>Reasons:</p>
                        <ul className='list-inside list-disc space-y-1'>
                          {amlBotStatus.rejectionDetails.profile.decline_reasons.map(
                            (reason: string, index: number) => (
                              <li key={index} className='text-xs text-red-700'>
                                {reason}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              )}

              {/* Document Verification */}
              {amlBotStatus.rejectionDetails.document && (
                <div className='rounded-lg border border-red-200 bg-red-50 p-3'>
                  <div className='mb-2 flex items-center gap-2'>
                    <div className='h-2 w-2 rounded-full bg-red-500'></div>
                    <p className='text-xs font-medium text-red-800'>Document Verification</p>
                  </div>
                  {amlBotStatus.rejectionDetails.document.comment && (
                    <p className='mb-2 text-xs text-red-700'>
                      {amlBotStatus.rejectionDetails.document.comment}
                    </p>
                  )}
                  {amlBotStatus.rejectionDetails.document.decline_reasons &&
                    amlBotStatus.rejectionDetails.document.decline_reasons.length > 0 && (
                      <div className='space-y-1'>
                        <p className='text-xs font-medium text-red-800'>Reasons:</p>
                        <ul className='list-inside list-disc space-y-1'>
                          {amlBotStatus.rejectionDetails.document.decline_reasons.map(
                            (reason: string, index: number) => (
                              <li key={index} className='text-xs text-red-700'>
                                {reason}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Activity Log */}
      <div className='rounded-xl border border-gray-200 bg-white p-6'>
        {/* Header */}
        <div className='mb-6 border-b border-gray-200 pb-2'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Activity Log ({activities.length})
          </h2>
        </div>

        {/* Activity List */}
        <div className='divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white'>
          {filteredActivities.length > 0 ? (
            <>
              {filteredActivities.map(activity => (
                <div
                  key={activity.id}
                  className='flex items-center justify-between p-4 transition-all hover:bg-gray-50/50'
                >
                  <div className='flex items-center gap-4'>
                    {/* Icon Circle */}
                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-50'>
                      <ActivityIcon />
                    </div>

                    {/* Content */}
                    <div className='space-y-0.5'>
                      <p className='text-xs font-medium text-gray-400'>{activity.user}</p>
                      <p className='text-sm font-semibold text-gray-800'>
                        {activity.action}{' '}
                        {activity.target &&
                          (activity.target.link ? (
                            <a
                              href={activity.target.link}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-blue-600 hover:text-blue-700 hover:underline'
                            >
                              {activity.target.name}
                            </a>
                          ) : (
                            <span className='font-medium text-gray-600'>
                              {activity.target.name}
                            </span>
                          ))}
                      </p>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className='text-right'>
                    <p className='text-xs font-medium text-gray-400'>{activity.timestamp}</p>
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className='p-4 text-center'>
                  <button
                    onClick={handleLoadMore}
                    className='text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline'
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className='flex h-40 flex-col items-center justify-center p-8 text-center'>
              <p className='text-sm text-gray-500 italic'>
                No activity logs found for this client.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
