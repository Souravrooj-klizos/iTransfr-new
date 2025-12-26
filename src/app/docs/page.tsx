'use client';

import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import 'swagger-ui-react/swagger-ui.css';

// Custom CSS to force light theme and override dark theme
const lightThemeCSS = `
  .swagger-ui {
    background: #ffffff !important;
    color: #3b4151 !important;
  }

  .swagger-ui .topbar { display: none; }

  .swagger-ui .info .title {
    color: #3b4151 !important;
  }

  .swagger-ui .scheme-container {
    background: #ffffff !important;
    border: 1px solid #dadada !important;
  }

  .swagger-ui .opblock {
    background: #ffffff !important;
    border: 1px solid #dadada !important;
  }

  .swagger-ui .opblock-summary {
    background: #ffffff !important;
  }

  .swagger-ui .opblock-body {
    background: #ffffff !important;
  }

  .swagger-ui .parameters {
    background: #ffffff !important;
  }

  .swagger-ui .responses {
    background: #ffffff !important;
  }

  .swagger-ui .response {
    background: #ffffff !important;
  }

  .swagger-ui .highlight-code {
    background: #f4f4f4 !important;
    color: #3b4151 !important;
  }

  .swagger-ui .copy-to-clipboard {
    background: #f4f4f4 !important;
  }

  .swagger-ui .markdown {
    color: #3b4151 !important;
  }

  .swagger-ui .response-col_status {
    color: #3b4151 !important;
  }

  .swagger-ui .tab li {
    background: #ffffff !important;
  }

  .swagger-ui .tab li button {
    color: #3b4151 !important;
  }

  .swagger-ui .model {
    background: #ffffff !important;
  }

  .swagger-ui .model-title {
    color: #3b4151 !important;
  }

  /* Override any dark theme variables */
  :root {
    --swagger-ui-bg-color: #ffffff !important;
    --swagger-ui-text-color: #3b4151 !important;
    --swagger-ui-border-color: #dadada !important;
  }
`;

// Isolated SwaggerUI component that bypasses React strict mode
const IsolatedSwaggerUI = ({ spec }: { spec: any }) => {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [root, setRoot] = useState<any>(null);

  useEffect(() => {
    if (containerRef && !root) {
      // Create a separate React root for SwaggerUI, isolated from main app's strict mode
      const newRoot = createRoot(containerRef);
      setRoot(newRoot);

      // Dynamically import and render SwaggerUI in the isolated root
      import('swagger-ui-react').then(({ default: SwaggerUI }) => {
        newRoot.render(
          <SwaggerUI
            spec={spec}
            docExpansion="list"
            deepLinking={true}
            displayRequestDuration={true}
            tryItOutEnabled={true}
            requestInterceptor={(req: any) => req}
            responseInterceptor={(res: any) => res}
          />
        );
      });
    }

    return () => {
      if (root) {
        root.unmount();
      }
    };
  }, [containerRef, root, spec]);

  // Inject light theme CSS when component mounts
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = lightThemeCSS;
    document.head.appendChild(style);

    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  return <div ref={setContainerRef} className="swagger-ui-container" />;
};

// Wrapper component for consistency
const SwaggerUIWrapper = ({ spec }: { spec: any }) => {
  return <IsolatedSwaggerUI spec={spec} />;
};

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSwaggerSpec = async () => {
      try {
        const response = await fetch('/api/docs');
        if (!response.ok) {
          throw new Error('Failed to fetch API documentation');
        }
        const swaggerSpec = await response.json();
        setSpec(swaggerSpec);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSwaggerSpec();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Documentation</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-blue-600 text-white p-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">iTransfr API Documentation</h1>
          <p className="mt-2">Complete API reference for the iTransfr remittance platform</p>
          <div className="mt-4 text-sm space-y-2">
            <div className="bg-blue-50 p-3 rounded">
              <p className="font-semibold text-blue-800">🔐 Authentication Methods:</p>
              <p className="text-gray-600"><strong>Client Auth (clientAuth):</strong> Supabase session cookies for customers</p>
              <p className="text-gray-600"><strong>Admin Auth (adminAuth):</strong> Supabase session + admin role verification</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="font-semibold text-green-800">👤 Client APIs:</p>
              <p className="text-gray-600">Authentication, Transactions, KYC - for regular users</p>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <p className="font-semibold text-red-800">🛡️ Admin APIs:</p>
              <p className="text-gray-600">Dashboard, Management, Integrations - admin-only access</p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4 bg-white">
        {spec && <SwaggerUIWrapper spec={spec} />}
      </div>
    </div>
  );
}
