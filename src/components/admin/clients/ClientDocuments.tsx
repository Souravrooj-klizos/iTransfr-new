'use client';

import { DocumentItem } from '@/components/admin/clients/DocumentItem';
import { adminClientApi, BeneficialOwner } from '@/lib/api/admin-client';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ClientDocument {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
  status: string;
  ownerId?: string;
}

interface ClientDocumentsProps {
  clientId: string;
}

// Document type mapping for business documents (matches API response types)
const BUSINESS_DOC_TYPES = {
  formationDocument: { title: 'Formation Document', description: 'Articles of Incorporation or Operating Agreement' },
  proofOfRegistration: { title: 'Proof of Registration', description: 'Certificate of Good Standing' },
  proofOfOwnership: { title: 'Proof of Ownership', description: 'Operating Agreement, Bylaws, or Cap Table' },
  bankStatement: { title: 'Bank Statement', description: 'Within 90 days' },
  taxId: { title: 'Tax ID Verification', description: 'IRS Letter 147C, W-9, or equivalent' },
};

// Document type mapping for representative documents
const REP_DOC_TYPES = {
  governmentId: { title: 'Government ID' },
  proofOfAddress: { title: 'Proof of Address' },
  selfieWithId: { title: 'Selfie with ID' },
};

export function ClientDocuments({ clientId }: ClientDocumentsProps) {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [owners, setOwners] = useState<BeneficialOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guard against duplicate fetch calls (React StrictMode)
  const hasFetched = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both documents and owners in parallel
      const [docsResponse, ownersResponse] = await Promise.all([
        adminClientApi.getDocuments(clientId),
        adminClientApi.getOwners(clientId),
      ]);

      if (docsResponse.success) {
        setDocuments(docsResponse.documents || []);
      }

      if (ownersResponse.success) {
        // Filter owners with 25%+ ownership
        const qualifiedOwners = (ownersResponse.owners || []).filter(
          owner => owner.ownership_percentage >= 25
        );
        setOwners(qualifiedOwners);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error loading documents');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId && !hasFetched.current) {
      hasFetched.current = true;
      fetchData();
    }
  }, [clientId]);

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await adminClientApi.deleteClientDocument(clientId, documentId);
      if (response.success) {
        setDocuments(docs => docs.filter(d => d.id !== documentId));
      } else {
        alert('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document');
    }
  };

  const handleUpload = (docType: string, ownerId?: string) => {
    // TODO: Implement file upload modal
    console.log('Upload:', docType, ownerId);
    alert(`Upload ${docType} - Feature coming soon`);
  };

  // Helper to find a document by type and optionally owner
  const findDocument = (type: string, ownerId?: string) => {
    return documents.find(doc => {
      const typeMatch = doc.type === type || doc.type.toLowerCase() === type.toLowerCase();
      if (ownerId) {
        return typeMatch && doc.ownerId === ownerId;
      }
      return typeMatch && !doc.ownerId; // Business docs have no ownerId
    });
  };

  // Convert API document to DocumentItem format
  const toDocumentItemFormat = (doc: ClientDocument | undefined) => {
    if (!doc) return undefined;
    return {
      id: doc.id,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      uploadedAt: doc.uploadedAt,
      status: doc.status,
    };
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-12 rounded-xl border border-gray-200 bg-white'>
        <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
      </div>
    );
  }

  return (
    <div className='space-y-4 rounded-xl border border-gray-200 bg-white p-4 pb-4'>
      <h2 className='text-lg border-b border-gray-200 pb-2 font-semibold text-gray-900'>Documents</h2>

      <div className='grid grid-cols-1 gap-6 border border-gray-100 lg:grid-cols-2 rounded-lg p-3'>
        {/* Business Documents Section */}
        <div className='space-y-6 border-r border-gray-100 pr-6'>
          <div className='space-y-1'>
            <h3 className='text-base font-semibold text-gray-900'>Business Documents</h3>
            <p className='text-sm font-normal text-gray-400'>
              Required for InfinitusPay: Formation documents, registration, ownership structure
            </p>
          </div>

          <div className='space-y-4'>
            {Object.entries(BUSINESS_DOC_TYPES).map(([type, config]) => (
              <DocumentItem
                key={type}
                title={config.title}
                description={config.description}
                document={toDocumentItemFormat(findDocument(type))}
                onUpload={() => handleUpload(type)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>

        {/* Representative Documents Section */}
        <div className='space-y-6'>
          <div className='space-y-1'>
            <h3 className='text-base font-semibold text-gray-900'>Representative Documents</h3>
            <p className='text-sm font-normal text-gray-400'>
              Required for beneficial owners with 25%+ ownership
            </p>
          </div>

          <div className='space-y-2'>
            {owners.length > 0 ? (
              owners.map(owner => (
                <div key={owner.id} className='overflow-hidden rounded-xl border border-gray-100 p-0'>
                  <div className='bg-white px-4 py-2'>
                    <h4 className='text-sm font-semibold text-gray-900'>
                      {owner.first_name} {owner.last_name}
                    </h4>
                    <p className='text-xs font-normal text-gray-400'>
                      {owner.ownership_percentage}% Ownership
                    </p>
                  </div>
                  <div>
                    {Object.entries(REP_DOC_TYPES).map(([type, config]) => (
                      <DocumentItem
                        key={`${owner.id}-${type}`}
                        title={config.title}
                        variant='solid'
                        document={toDocumentItemFormat(findDocument(type, owner.id))}
                        onUpload={() => handleUpload(type, owner.id)}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center'>
                <p className='text-sm text-gray-500'>
                  No representatives with 25%+ ownership found.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className='mt-4 rounded-lg border border-orange-200 bg-orange-50/50 p-4'>
        <p className='text-sm text-yellow-600'>
          <span className='font-semibold'>InfinitusPay Requirements:</span> All business documents
          and documents for owners with 25%+ ownership must be uploaded before submission.
        </p>
      </div>
    </div>
  );
}

