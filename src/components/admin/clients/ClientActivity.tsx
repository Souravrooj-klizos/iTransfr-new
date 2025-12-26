import ActivityIcon from '@/components/icons/ActivityIcon';
import { adminClientApi } from '@/lib/api/admin-client';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target?: {
    name: string;
    link?: string;
  };
  timestamp: string;
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
  const LIMIT = 20;

  // Guard against duplicate fetch calls (React StrictMode)
  const hasFetched = useRef(false);

  const fetchActivity = useCallback(async (isLoadMore = false) => {
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
  }, [clientId, offset]);

  useEffect(() => {
    if (clientId && !hasFetched.current) {
      hasFetched.current = true;
      fetchActivity();
    }
  }, [clientId]);

  const handleLoadMore = () => {
    fetchActivity(true);
  };

  if (loading && activities.length === 0) {
    return (
      <div className='flex items-center justify-center p-12 rounded-xl border border-gray-200 bg-white'>
        <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
      </div>
    );
  }

  return (
    <div className='rounded-xl border border-gray-200 bg-white p-6'>
      {/* Header */}
      <div className='mb-6 border-b border-gray-200 pb-2'>
        <h2 className='text-lg font-semibold text-gray-900'>Activity Log ({activities.length})</h2>
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
                      {activity.target && (
                        activity.target.link ? (
                          <a
                            href={activity.target.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className='text-blue-600 hover:text-blue-700 hover:underline'
                          >
                            {activity.target.name}
                          </a>
                        ) : (
                          <span className='font-medium text-gray-600'>{activity.target.name}</span>
                        )
                      )}
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
            <p className='text-sm text-gray-500 italic'>No activity logs found for this client.</p>
          </div>
        )}
      </div>
    </div>
  );
}
