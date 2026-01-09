"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberInvite, membersApi, WebsiteMember } from "@/lib/api/members.api";
import { onboardingApi, UserWebsite } from "@/lib/api/onboarding.api";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import InviteMembersForm from "./components/invite-members-form";
import MembersList from "./components/members-list";

interface WebsiteSettingsPageProps {
    params: Promise<{
        websiteId: string;
    }>;
}

export default function WebsiteSettingsPage({ params }: WebsiteSettingsPageProps) {
    const { websiteId } = use(params);
    const router = useRouter();
    const [website, setWebsite] = useState<UserWebsite | null>(null);
    const [allWebsites, setAllWebsites] = useState<UserWebsite[]>([]);
    const [members, setMembers] = useState<WebsiteMember[]>([]);
    const [pendingInvites, setPendingInvites] = useState<MemberInvite[]>([]);
    const [acceptedInvites, setAcceptedInvites] = useState<MemberInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"settings" | "members">("members");

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                const websites = await onboardingApi.getUserWebsites();
                setAllWebsites(websites);

                // Find current website
                const currentWebsite = websites.find((w) => w.websiteId === websiteId);
                if (!currentWebsite) {
                    setError("Website not found");
                    return;
                }
                setWebsite(currentWebsite);

                // Load members and invites - non-blocking
                try {
                    const [websiteMembers, invites] = await Promise.all([
                        membersApi.getWebsiteMembers(websiteId),
                        membersApi.getWebsiteInvites(websiteId),
                    ]);

                    setMembers(websiteMembers);
                    setPendingInvites(invites.pending);
                    setAcceptedInvites(invites.accepted);
                } catch (membersErr: unknown) {
                    console.warn("Warning loading members:", membersErr);
                    // Don't block page load if members API fails
                    setMembers([]);
                    setPendingInvites([]);
                    setAcceptedInvites([]);
                }
            } catch (error: unknown) {
                const err = error as { response?: { data?: { message?: string } } };
                toast.error(err.response?.data?.message || "Failed to load website data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [websiteId]);

    const handleMemberInvited = async () => {
        try {
            const invites = await membersApi.getWebsiteInvites(websiteId);
            setPendingInvites(invites.pending);
            setAcceptedInvites(invites.accepted);
        } catch (err) {
            console.error("Error refreshing invites:", err);
        }
    };

    const handleMemberRemoved = async () => {
        try {
            const websiteMembers = await membersApi.getWebsiteMembers(websiteId);
            setMembers(websiteMembers);
        } catch (err) {
            console.error("Error refreshing members:", err);
        }
    };

    const handleMemberRoleUpdated = async () => {
        try {
            const websiteMembers = await membersApi.getWebsiteMembers(websiteId);
            setMembers(websiteMembers);
        } catch (err) {
            console.error("Error refreshing members:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded border border-gray-200">
                    <p>
                        <strong>Website ID:</strong> {websiteId}
                    </p>
                    <p>
                        <strong>Available Websites:</strong> {allWebsites.length}
                    </p>
                </div>
                <Button onClick={() => router.back()} className="mt-4">
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{website?.websiteName || website?.websiteUrl}</h1>
                <p className="text-gray-600 mt-2">Manage settings and members for this website</p>
            </div>

            <div className="border-b border-gray-200">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab("members")}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === "members"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        Members
                    </button>
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === "settings"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        Settings
                    </button>
                </div>
            </div>

            {activeTab === "members" && (
                <div className="space-y-6">
                    <InviteMembersForm websites={allWebsites} onSuccess={handleMemberInvited} />

                    <MembersList
                        members={members}
                        pendingInvites={pendingInvites}
                        acceptedInvites={acceptedInvites}
                        onMemberRemoved={handleMemberRemoved}
                        onMemberRoleUpdated={handleMemberRoleUpdated}
                    />
                </div>
            )}

            {activeTab === "settings" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Website Settings</CardTitle>
                        <CardDescription>Configure settings for this website</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">Settings section coming soon...</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
