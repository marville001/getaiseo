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

interface FormErrors {
	email?: string;
	websites?: string;
}

export default function InviteMembersForm({
	websites,
	onSuccess,
}: InviteMembersFormProps) {
	const [email, setEmail] = useState("");
	const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});
	const [serverError, setServerError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [touched, setTouched] = useState({
		email: false,
		websites: false,
	});

	const websiteOptions = websites.map((website) => ({
		value: website.websiteId,
		label: website.websiteName || website.websiteUrl,
	}));

	// Email validation
	const validateEmail = (value: string): string | undefined => {
		if (!value.trim()) {
			return "Email is required";
		}

		// Comprehensive email validation
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (!emailRegex.test(value.trim())) {
			return "Please enter a valid email address";
		}

		// Check for common typos
		const domain = value.split('@')[1]?.toLowerCase();
		const typos: { [key: string]: string } = {
			'gmial.com': 'gmail.com',
			'gmai.com': 'gmail.com',
			'yahooo.com': 'yahoo.com',
			'outlok.com': 'outlook.com',
		};

		if (domain && typos[domain]) {
			return `Did you mean ${value.split('@')[0]}@${typos[domain]}?`;
		}

		return undefined;
	};

	// Websites validation
	const validateWebsites = (value: string[]): string | undefined => {
		if (value.length === 0) {
			return "Please select at least one website";
		}

		if (value.length > 10) {
			return "You can select up to 10 websites at a time";
		}

		return undefined;
	};

	// Validate all fields
	const validateForm = (): boolean => {
		const newErrors: FormErrors = {
			email: validateEmail(email),
			websites: validateWebsites(selectedWebsites),
		};

		setErrors(newErrors);
		return !newErrors.email && !newErrors.websites;
	};

	// Handle email change with real-time validation
	const handleEmailChange = (value: string) => {
		setEmail(value);
		setServerError(null);

		if (touched.email) {
			setErrors(prev => ({
				...prev,
				email: validateEmail(value),
			}));
		}
	};

	// Handle email blur
	const handleEmailBlur = () => {
		setTouched(prev => ({ ...prev, email: true }));
		setErrors(prev => ({
			...prev,
			email: validateEmail(email),
		}));
	};

	// Handle websites change with real-time validation
	const handleWebsitesChange = (value: string[]) => {
		setSelectedWebsites(value);
		setServerError(null);

		if (touched.websites) {
			setErrors(prev => ({
				...prev,
				websites: validateWebsites(value),
			}));
		}
	};

	// Handle websites blur
	const handleWebsitesBlur = () => {
		setTouched(prev => ({ ...prev, websites: true }));
		setErrors(prev => ({
			...prev,
			websites: validateWebsites(selectedWebsites),
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Mark all fields as touched
		setTouched({
			email: true,
			websites: true,
		});

		// Clear previous errors
		setServerError(null);
		setSuccess(false);

		// Validate form
		if (!validateForm()) {
			return;
		}

		try {
			setLoading(true);
			await membersApi.inviteMember(email.trim(), selectedWebsites);

			// Success - reset form
			setSuccess(true);
			setEmail("");
			setSelectedWebsites([]);
			setErrors({});
			setTouched({
				email: false,
				websites: false,
			});

			// Clear success message after 5 seconds
			setTimeout(() => setSuccess(false), 5000);

			onSuccess?.();
		} catch (error: unknown) {
			const err = error as { response?: { data?: { message?: string; }; }; };
			setServerError(
				err.response?.data?.message ||
				"Failed to send invite. Please try again."
			);
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
				<div className="space-y-4">
					{/* Email Field */}
					<div className="space-y-2">
						<label htmlFor="email" className="text-sm font-medium">
							Email Address <span className="text-red-500">*</span>
						</label>
						<Input
							id="email"
							type="email"
							placeholder="member@example.com"
							value={email}
							onChange={(e) => handleEmailChange(e.target.value)}
							onBlur={handleEmailBlur}
							onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
							disabled={loading}
							className={errors.email && touched.email ? "border-red-500 focus-visible:ring-red-500" : ""}
						/>
						{errors.email && touched.email && (
							<p className="text-sm text-red-500 flex items-center gap-1">
								<AlertCircle className="h-3 w-3" />
								{errors.email}
							</p>
						)}
					</div>

					{/* Websites Field */}
					<div className="space-y-2">
						<label className="text-sm font-medium">
							Select Websites <span className="text-red-500">*</span>
						</label>
						<MultiSelect
							options={websiteOptions}
							value={selectedWebsites}
							onChange={handleWebsitesChange}
							placeholder="Choose websites to share..."
						/>
						{errors.websites && touched.websites && (
							<p className="text-sm text-red-500 flex items-center gap-1">
								<AlertCircle className="h-3 w-3" />
								{errors.websites}
							</p>
						)}
						<p className="text-xs text-gray-500">
							{selectedWebsites.length} of {websites.length} website{websites.length !== 1 ? 's' : ''} selected
						</p>
					</div>

					{serverError && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{serverError}</AlertDescription>
						</Alert>
					)}

					{/* Success Message */}
					{success && (
						<Alert className="border-green-500 bg-green-50">
							<CheckCircle className="h-4 w-4 text-green-600" />
							<AlertDescription className="text-green-800">
								Invitation sent successfully!
							</AlertDescription>
						</Alert>
					)}

					{/* Submit Button */}
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={loading}
						className="w-full"
					>
						{loading ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Sending Invitation...
							</>
						) : (
							"Send Invite"
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}