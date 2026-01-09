"use client";

import { useAuth } from "@/contexts/AuthContext";
import { MemberInvite, membersApi } from "@/lib/api/members.api";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const token = useMemo(() => searchParams.get("token"), [searchParams]);

  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<MemberInvite | null>(null);

  const verifyInvite = useCallback(async (inviteToken: string) => {
    try {
      setPageLoading(true);
      const invite = await membersApi.getInviteByToken(inviteToken);
      setInviteData(invite);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to verify invitation.";
      setError(message);
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      setPageLoading(false);
      return;
    }

    verifyInvite(token);
  }, [token, verifyInvite]);

  const handleAcceptInvite = async () => {
    if (!token || !inviteData) {
      setError("Invalid invitation state");
      return;
    }

    try {
      setActionLoading(true);

      if (!isAuthenticated) {
        localStorage.setItem("inviteToken", token);
        router.push(`/login?invite=${token}&email=${inviteData.email}`);
        return;
      }

      if (user?.email !== inviteData.email) {
        setError(`Please log in with ${inviteData.email} to accept this invitation.`);
        localStorage.setItem("inviteToken", token);
        return;
      }

      await membersApi.acceptInvite(token);
      localStorage.removeItem("inviteToken");
      router.push("/dashboard?invitation=accepted");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to accept invitation.";
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectInvite = () => {
    if (!token) return;
    router.push(`/dashboard/website-settings/reject-invite?token=${token}`);
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Processing your invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Invitation Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-6">
          <div className="text-blue-500 text-5xl mb-4">📨</div>
          <h2 className="text-2xl font-bold mb-2">Team Invitation</h2>
          <p className="text-gray-600">You&apos;ve been invited to join a team</p>
        </div>

        {inviteData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{inviteData.email}</p>
            </div>

            {inviteData.inviter && (
              <div>
                <p className="text-sm text-gray-600">Invited by</p>
                <p className="font-medium">
                  {inviteData.inviter.firstName} {inviteData.inviter.lastName}
                </p>
                <p className="text-sm text-gray-500">{inviteData.inviter.email}</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleAcceptInvite}
            disabled={actionLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg"
          >
            {actionLoading ? "Processing..." : "Accept Invitation"}
          </button>

          <button
            onClick={handleRejectInvite}
            disabled={actionLoading}
            className="w-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 px-6 py-3 rounded-lg"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
