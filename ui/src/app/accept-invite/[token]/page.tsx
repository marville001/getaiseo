/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { membersApi } from '@/lib/api/members.api';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const acceptInvite = async () => {
      try {
        const result = await membersApi.acceptInvite(token);
        setStatus('success');
        setMessage(result.message || 'Invitation accepted!');

        if (result.isNewUser) {
          setTimeout(() => {
            router.replace(`/signup?email=${encodeURIComponent(result.member?.user?.email || '')}&invited=true`);
          }, 2000);
        } else {
          setTimeout(() => {
            router.replace('/dashboard?invited=success');
          }, 2000);
        }
      } catch (error: any) {
        setStatus('error');
        const errorMsg = error?.response?.data?.message || 'Failed to accept invite';
        setMessage(errorMsg);

        // Check if it's an authentication error
        if (error?.response?.status === 401) {
          // User needs to login first, then accept
          setTimeout(() => {
            router.replace(`/login?redirect=/accept-invite/${token}`);
          }, 2000);
        }
      }
    };

    if (token) {
      acceptInvite();
    }
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Processing Invitation</h2>
            <p className="text-gray-600">Please wait...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-green-700">Success!</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">Redirecting...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-700">Error</h2>
            <p className="text-gray-600">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}