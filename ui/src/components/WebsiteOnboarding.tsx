import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { onboardingApi, type PageStats, type UserWebsite } from '@/lib/api/onboarding.api';
import { cn } from '@/lib/utils';
import { useWebsiteStore } from '@/stores/website.store';
import { CheckCircle2, FileText, Globe, Loader2, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const STEPS = [
	{ id: 1, title: 'Add Website', description: 'Enter your website URL' },
	{ id: 2, title: 'Analyze', description: 'We analyze your website' },
	{ id: 3, title: 'Complete', description: 'Website added successfully' },
];

type OnboardingMode = 'onboarding' | 'add-website';

interface OnboardingProps {
	mode?: OnboardingMode;
	onWebsiteAdded?: (website: UserWebsite) => void;
	onClose?: () => void;
	showCloseButton?: boolean;
	initialUrl?: string;
}

// Memoized step indicator component to prevent re-renders of all steps
const StepIndicator = memo(({ step, currentStep }: { step: typeof STEPS[0]; currentStep: number }) => {
	const isCompleted = currentStep > step.id;
	const isCurrent = currentStep === step.id;

	return (
		<div className="flex items-center">
			<div className="flex flex-col items-center">
				<div
					className={cn(
						'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all',
						isCompleted
							? 'bg-green-500 text-white'
							: isCurrent
								? 'bg-blue-600 text-white'
								: 'bg-gray-200 text-gray-500'
					)}
				>
					{isCompleted ? (
						<CheckCircle2 className="h-5 w-5" />
					) : (
						step.id
					)}
				</div>
				<span className="text-xs mt-2 text-gray-600 hidden sm:block">
					{step.title}
				</span>
			</div>
		</div>
	);
});

StepIndicator.displayName = 'StepIndicator';

const ProgressItem = memo(({
	completed,
	label,
	showSpinner = false
}: {
	completed: boolean;
	label: string;
	showSpinner?: boolean;
}) => (
	<div className="flex items-center gap-2 text-sm">
		{showSpinner ? (
			<Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
		) : (
			<CheckCircle2 className={cn(
				'h-4 w-4',
				completed ? 'text-green-500' : 'text-gray-300'
			)} />
		)}
		<span className={completed ? 'text-gray-700' : 'text-gray-400'}>
			{label}
		</span>
	</div>
));

ProgressItem.displayName = 'ProgressItem';

const PageStatsDisplay = memo(({ pageStats }: { pageStats: PageStats }) => (
	<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
		<div className="flex items-center gap-2 mb-3">
			<FileText className="h-4 w-4 text-blue-600" />
			<span className="font-medium text-blue-900">Scraping Internal Pages</span>
		</div>
		<div className="grid grid-cols-3 gap-4 text-center">
			<div>
				<p className="text-2xl font-bold text-blue-600">{pageStats.total}</p>
				<p className="text-xs text-gray-600">Pages Found</p>
			</div>
			<div>
				<p className="text-2xl font-bold text-green-600">{pageStats.completed}</p>
				<p className="text-xs text-gray-600">Completed</p>
			</div>
			<div>
				<p className="text-2xl font-bold text-orange-600">{pageStats.pending}</p>
				<p className="text-xs text-gray-600">In Progress</p>
			</div>
		</div>
	</div>
));

PageStatsDisplay.displayName = 'PageStatsDisplay';

export const WebsiteOnboarding: React.FC<OnboardingProps> = memo(({
	mode = 'onboarding',
	onWebsiteAdded,
	onClose,
	showCloseButton = false,
	initialUrl = ''
}) => {
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState(1);
	const [websiteUrl, setWebsiteUrl] = useState(initialUrl);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [website, setWebsite] = useState<UserWebsite | null>(null);
	const [pageStats, setPageStats] = useState<PageStats | null>(null);
	const [scrapingProgress, setScrapingProgress] = useState(0);
	const [isLoading, setIsLoading] = useState(mode === 'onboarding');

	const setWebsites = useWebsiteStore(state => state.setWebsites);
	const websites = useWebsiteStore(state => state.websites);
	const setCurrentWebsite = useWebsiteStore(state => state.setCurrentWebsite);
	const currentWebsite = useWebsiteStore(state => state.currentWebsite);


	// Memoize getRedirectPath to prevent recreation
	const getRedirectPath = useCallback((websiteId?: string) => {
		if (mode === 'onboarding') {
			return websiteId ? `/dashboard/websites/${websiteId}` : '/dashboard/websites';
		}
		return null;
	}, [mode]); // Only recreate when mode changes

	// Memoize the polling function to prevent recreation
	const pollScrapingStatus = useCallback(async (websiteId: string) => {
		const poll = async () => {
			try {
				const statusResponse = await onboardingApi.getScrapingStatus(websiteId);
				const { website: ws, pageStats: ps } = statusResponse;
				setWebsite(ws);
				setPageStats(ps);

				// Calculate progress - memoize calculation
				let progress = 10;
				if (ws.totalPagesFound > 0) {
					const mainPageDone = ws.scrapedAt ? 30 : 0;
					const pageProgress = ps.total > 0
						? ((ps.completed / ps.total) * 60)
						: 0;
					progress = Math.min(mainPageDone + pageProgress + 10, 95);
				}
				setScrapingProgress(progress);

				if (ws.scrapingStatus === 'completed') {
					setScrapingProgress(100);
					setTimeout(() => {
						setCurrentStep(3);
					}, 500);
					return true;
				} else if (ws.scrapingStatus === 'failed') {
					setScrapingProgress(0);
					toast.error(ws.scrapingError || 'Failed to analyze website. Please try again.');
					setCurrentStep(1);
					return true;
				}
				return false;
			} catch (error) {
				console.error('Failed to poll status:', error);
				return false;
			}
		};

		const pollInterval = setInterval(async () => {
			const done = await poll();
			if (done) {
				clearInterval(pollInterval);
			}
		}, 2000);

		await poll();

		return () => {
			clearInterval(pollInterval);
		};
	}, []); // Empty dependencies since it doesn't depend on state/props

	// Memoize step titles based on mode
	const stepTitles = useMemo(() => {
		return STEPS.map(step => ({
			...step,
			title: step.id === 3 && mode === 'onboarding' ? 'Get Started' : step.title
		}));
	}, [mode]);

	// Memoize progress items to prevent re-renders
	const progressItems = useMemo(() => [
		{
			completed: scrapingProgress >= 10,
			label: 'Connecting to website...'
		},
		{
			completed: scrapingProgress >= 30,
			label: 'Analyzing main page content...'
		},
		{
			completed: scrapingProgress >= 40,
			label: 'Discovering internal pages...'
		},
		{
			completed: scrapingProgress >= 90,
			showSpinner: scrapingProgress >= 40 && scrapingProgress < 90,
			label: `Scraping internal pages ${pageStats ? `(${pageStats.completed}/${pageStats.total})` : ''}...`
		},
		{
			completed: scrapingProgress >= 95,
			label: 'Finalizing analysis...'
		}
	], [scrapingProgress, pageStats]);

	// Optimize useEffect dependencies
	useEffect(() => {
		if (mode !== 'onboarding') {
			setIsLoading(false);
			return;
		}

		const fetchStatus = async () => {
			try {
				const status = await onboardingApi.getOnboardingStatus();

				if (status.isOnboarded && status.website) {
					const redirectPath = getRedirectPath(status.website.websiteId);
					if (redirectPath) {
						router.push(redirectPath);
					}
					return;
				}

				if (status.hasWebsite && status.website) {
					setWebsite(status.website);
					setWebsiteUrl(status.website.websiteUrl);
					if (status.pageStats) {
						setPageStats(status.pageStats);
					}

					if (status.websiteStatus === 'completed') {
						setCurrentStep(3);
						setScrapingProgress(100);
					} else if (status.websiteStatus === 'processing') {
						setCurrentStep(2);
						pollScrapingStatus(status.website.websiteId);
					} else if (status.websiteStatus === 'pending') {
						setCurrentStep(2);
					} else if (status.websiteStatus === 'failed') {
						setCurrentStep(1);
						toast.error('Previous scraping failed. Please try again.');
					}
				}
			} catch (error) {
				console.error('Failed to fetch onboarding status:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchStatus();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, getRedirectPath]); // Removed router from dependencies since it's stable

	// Memoize reset function
	const resetForNewWebsite = useCallback(() => {
		setCurrentStep(1);
		setWebsiteUrl('');
		setWebsite(null);
		setPageStats(null);
		setScrapingProgress(0);
		setIsSubmitting(false);
	}, []);

	// Memoize website submission handler
	const handleSubmitWebsite = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();

		if (!websiteUrl.trim()) {
			toast.error('Please enter a website URL');
			return;
		}

		setIsSubmitting(true);
		try {
			const newWebsite = await onboardingApi.submitWebsite(websiteUrl);
			setWebsite(newWebsite);
			setCurrentStep(2);
			setScrapingProgress(5);

			// Update current website logic
			if (newWebsite?.websiteId !== currentWebsite?.websiteId) {
				setCurrentWebsite(newWebsite);
			}

			if(websites === null){
				setWebsites([newWebsite]);
			} else {
				setWebsites([...websites, newWebsite]);
			}

			await onboardingApi.startScraping(newWebsite.websiteId);
			pollScrapingStatus(newWebsite.websiteId);
		} catch (error) {
			console.error('Failed to submit website:', error);
			toast.error('Failed to submit website. Please check the URL and try again.');
		} finally {
			setIsSubmitting(false);
		}
	}, [websiteUrl, pollScrapingStatus, currentWebsite, setCurrentWebsite, websites, setWebsites]);

	// Memoize completion handler
	const handleComplete = useCallback(async () => {
		setIsSubmitting(true);
		try {
			if (mode === 'onboarding') {
				await onboardingApi.completeOnboarding();
				toast.success('Welcome to GetAISEO!');

				if (website) {
					const redirectPath = getRedirectPath(website.websiteId);
					if (redirectPath) {
						router.push(redirectPath);
					}
				}
			} else {
				if (website) {
					toast.success(`Website ${website.websiteName || website.websiteUrl} added successfully!`);

					if (onWebsiteAdded) {
						onWebsiteAdded(website);
					}

					if (onClose) {
						onClose();
					} else {
						resetForNewWebsite();
					}

					const redirectPath = getRedirectPath(website.websiteId);
					if (redirectPath) {
						router.push(redirectPath);
					}
				}
			}
		} catch (error) {
			console.error('Failed to complete:', error);
			toast.error('Failed to complete. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	}, [mode, website, getRedirectPath, router, onWebsiteAdded, onClose, resetForNewWebsite]);

	const handleWebsiteUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setWebsiteUrl(e.target.value);
	}, []);

	if (isLoading) {
		return (
			<div className="min-h-[400px] flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
			</div>
		);
	}

	return (
		<div className="relative">
			{showCloseButton && onClose && (
				<Button
					variant="ghost"
					size="icon"
					className="absolute right-0 top-0 z-10"
					onClick={onClose}
				>
					<X className="h-4 w-4" />
				</Button>
			)}

			{/* Progress Steps - Memoized */}
			<div className="mb-8">
				<div className="flex items-center justify-between">
					{stepTitles.map((step, index) => (
						<React.Fragment key={step.id}>
							<StepIndicator step={step} currentStep={currentStep} />
							{index < stepTitles.length - 1 && (
								<div
									className={cn(
										'h-1 w-16 sm:w-24 mx-2 rounded transition-all',
										currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
									)}
								/>
							)}
						</React.Fragment>
					))}
				</div>
			</div>

			{/* Step Content */}
			<Card className="shadow-lg">
				{currentStep === 1 && (
					<>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Globe className="h-5 w-5 text-blue-600" />
								{mode === 'onboarding' ? 'Enter Your Website URL' : 'Add New Website'}
							</CardTitle>
							<CardDescription>
								{mode === 'onboarding'
									? 'We\'ll analyze your website to provide personalized SEO recommendations'
									: 'Add another website to analyze and track'}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmitWebsite} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="websiteUrl">Website URL</Label>
									<Input
										id="websiteUrl"
										type="text"
										placeholder="https://example.com"
										value={websiteUrl}
										onChange={handleWebsiteUrlChange}
										className="text-lg"
										disabled={isSubmitting}
										autoFocus
									/>
									<p className="text-sm text-gray-500">
										Enter the full URL of your website including https://
									</p>
								</div>
								<Button
									type="submit"
									className="w-full"
									size="lg"
									disabled={isSubmitting || !websiteUrl.trim()}
								>
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Submitting...
										</>
									) : (
										'Continue'
									)}
								</Button>
							</form>
						</CardContent>
					</>
				)}

				{currentStep === 2 && (
					<>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
								Analyzing Your Website
							</CardTitle>
							<CardDescription>
								Please wait while we analyze your website and its pages
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span className="text-gray-600">Overall Progress</span>
									<span className="font-medium">{Math.round(scrapingProgress)}%</span>
								</div>
								<Progress value={scrapingProgress} className="h-3" />
							</div>

							{pageStats && pageStats.total > 0 && (
								<PageStatsDisplay pageStats={pageStats} />
							)}

							<div className="bg-gray-50 rounded-lg p-4 space-y-3">
								{progressItems.map((item, index) => (
									<ProgressItem
										key={index}
										completed={item.completed}
										label={item.label}
										showSpinner={item.showSpinner}
									/>
								))}
							</div>

							<p className="text-center text-sm text-gray-500">
								{pageStats && pageStats.total > 0
									? `Analyzing ${pageStats.total} pages. This may take a few minutes...`
									: 'This usually takes 30 seconds to a few minutes depending on your website size'}
							</p>
						</CardContent>
					</>
				)}

				{currentStep === 3 && (
					<>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CheckCircle2 className="h-5 w-5 text-green-500" />
								{mode === 'onboarding' ? 'Analysis Complete!' : 'Website Added Successfully!'}
							</CardTitle>
							<CardDescription>
								{mode === 'onboarding'
									? 'Your website has been analyzed successfully'
									: 'The website has been analyzed and is ready to use'}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Website details could also be memoized if complex */}
							{website && (
								<WebsiteDetails website={website} />
							)}

							<div className="space-y-3">
								<Button
									onClick={handleComplete}
									className="w-full"
									size="lg"
									disabled={isSubmitting}
								>
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											{mode === 'onboarding' ? 'Getting Started...' : 'Completing...'}
										</>
									) : (
										<>
											<Sparkles className="mr-2 h-4 w-4" />
											{mode === 'onboarding' ? 'Go to Dashboard' : 'Done'}
										</>
									)}
								</Button>
							</div>
						</CardContent>
					</>
				)}
			</Card>
		</div>
	);
});


const WebsiteDetails = memo(({ website }: { website: UserWebsite }) => (
	<div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
		<div className="flex items-start gap-3">
			{website.scrapedMeta?.favicon ? (
				<img
					src={website.scrapedMeta.favicon}
					alt="Favicon"
					className="w-8 h-8 rounded"
				/>
			) : (
				<Globe className="w-8 h-8 text-gray-400" />
			)}
			<div className="flex-1 min-w-0">
				<h3 className="font-semibold text-gray-900 truncate">
					{website.websiteName || website.websiteUrl}
				</h3>
				<p className="text-sm text-gray-600 line-clamp-2">
					{website.websiteDescription || 'No description available'}
				</p>
			</div>
		</div>

		{(website.totalPagesScraped && website.totalPagesScraped > 0) && (
			<div className="pt-2 border-t border-green-200">
				<div className="flex items-center gap-2 text-sm">
					<FileText className="h-4 w-4 text-green-600" />
					<span className="text-gray-700">
						<strong>{website.totalPagesScraped}</strong> pages analyzed
						{website.totalPagesFound && website.totalPagesFound > website.totalPagesScraped && (
							<span className="text-gray-500"> of {website.totalPagesFound} found</span>
						)}
					</span>
				</div>
			</div>
		)}

		{website.scrapedMeta?.keywords && website.scrapedMeta.keywords.length > 0 && (
			<div className="pt-2 border-t border-green-200">
				<p className="text-xs text-gray-500 mb-2">Keywords detected:</p>
				<div className="flex flex-wrap gap-1">
					{website.scrapedMeta.keywords.slice(0, 5).map((keyword, index) => (
						<span
							key={index}
							className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
						>
							{keyword}
						</span>
					))}
				</div>
			</div>
		)}
	</div>
));

WebsiteDetails.displayName = 'WebsiteDetails';

WebsiteOnboarding.displayName = 'WebsiteOnboarding';