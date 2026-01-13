'use client';

import { WebsiteOnboarding } from '@/components/WebsiteOnboarding';
import { useUserStore } from '@/stores/user.store';
import { Sparkles } from 'lucide-react';

export default function OnboardingPage() {
	const user = useUserStore(state => state.user);

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
			<div className="w-full max-w-2xl">
				{/* Header */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
						<Sparkles className="h-8 w-8 text-blue-600" />
					</div>
					<h1 className="text-3xl font-bold text-gray-900">Welcome{user?.firstName ? `, ${user.firstName}` : ''}!</h1>
					<p className="text-gray-600 mt-2">Let&apos;s set up your account in just a few steps</p>
				</div>

				<WebsiteOnboarding mode='onboarding' />

				{/* Footer Note */}
				<p className="text-center text-sm text-gray-500 mt-6">
					You can add more websites later from your dashboard settings
				</p>
			</div>
		</div>
	);
}
