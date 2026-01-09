"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { onboardingApi, UserWebsite } from "@/lib/api/onboarding.api";
import { Loader2, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function WebsiteSettingsPage() {
	const [websites, setWebsites] = useState<UserWebsite[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadWebsites = async () => {
			try {
				const data = await onboardingApi.getUserWebsites();
				setWebsites(data);
			} catch (error) {
				console.error("Failed to load websites:", error);
			} finally {
				setLoading(false);
			}
		};

		loadWebsites();
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Website Settings</h1>
				<p className="text-gray-600 mt-2">
					Manage settings and team members for your websites
				</p>
			</div>

			{websites.length === 0 ? (
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-gray-500 mb-4">No websites found</p>
						<Link href="/dashboard">
							<Button>Go to Dashboard</Button>
						</Link>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{websites.map((website) => (
						<Card
							key={website.websiteId}
							className="hover:shadow-lg transition-shadow cursor-pointer"
						>
							<CardHeader>
								<CardTitle className="text-lg truncate">
									{website.websiteName || website.websiteUrl}
								</CardTitle>
								<CardDescription className="text-xs truncate">
									{website.websiteUrl}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="text-sm text-gray-600">
									<p>
										<strong>Status:</strong>{" "}
										<span className="capitalize">
											{website.scrapingStatus}
										</span>
									</p>
									<p>
										<strong>Pages:</strong> {website.totalPagesScraped}/{website.totalPagesFound}
									</p>
								</div>
								<Link
									href={`/dashboard/website-settings/${website.websiteId}`}
								>
									<Button className="w-full">
										<Settings className="h-4 w-4 mr-2" />
										Manage
									</Button>
								</Link>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
