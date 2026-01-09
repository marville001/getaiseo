"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { membersApi } from "@/lib/api/members.api";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import MultiSelect from "./multi-select";

interface UserWebsite {
	websiteId: string;
	websiteName?: string;
	websiteUrl: string;
}

interface InviteMembersFormProps {
	websites: UserWebsite[];
	onSuccess?: () => void;
}

export default function InviteMembersForm({
	websites,
	onSuccess,
}: InviteMembersFormProps) {
	const [email, setEmail] = useState("");
	const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const websiteOptions = websites.map((website) => ({
		value: website.websiteId,
		label: website.websiteName || website.websiteUrl,
	}));

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(false);

		if (!email.trim()) {
			setError("Email is required");
			return;
		}

		if (selectedWebsites.length === 0) {
			setError("Please select at least one website");
			return;
		}

		// Basic email validation
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			setError("Please enter a valid email address");
			return;
		}

		try {
			setLoading(true);
			await membersApi.inviteMember(email, selectedWebsites);

			setSuccess(true);
			setEmail("");
			setSelectedWebsites([]);

			setTimeout(() => setSuccess(false), 3000);
			onSuccess?.();
		} catch (error: unknown) {
			const err = error as { response?: { data?: { message?: string; }; }; };
			setError(err.response?.data?.message || "Failed to send invite");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Invite Members</CardTitle>
				<CardDescription>
					Invite team members and grant them access to your websites
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<label htmlFor="email" className="text-sm font-medium">
							Email Address
						</label>
						<Input
							id="email"
							type="email"
							placeholder="member@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							disabled={loading}
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">
							Select Websites
						</label>
						<MultiSelect
							options={websiteOptions}
							value={selectedWebsites}
							onChange={setSelectedWebsites}
							placeholder="Choose websites to share..."
						/>
					</div>

					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					{success && (
						<Alert>
							<CheckCircle className="h-4 w-4" />
							<AlertDescription>
								Invite sent successfully to {email}
							</AlertDescription>
						</Alert>
					)}

					<Button
						type="submit"
						disabled={loading}
						className="w-full"
					>
						{loading ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Sending...
							</>
						) : (
							"Send Invite"
						)}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
