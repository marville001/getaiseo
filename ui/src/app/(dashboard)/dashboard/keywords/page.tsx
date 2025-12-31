"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Keyword, keywordsApi } from "@/lib/api/keywords.api";
import {
	AlertCircle,
	BarChart3,
	Key,
	Loader2,
	MoreHorizontal,
	Plus,
	RefreshCw,
	Target,
	Trash2,
	TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import AddKeywordsModal from "./components/add-keywords-modal";

// Competition badge component
const CompetitionBadge = ({ competition }: { competition: Keyword["competition"]; }) => {
	const variants: Record<Keyword["competition"], { color: string; label: string; }> = {
		low: { color: "bg-green-100 text-green-800 border-green-200", label: "Low" },
		medium: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Medium" },
		high: { color: "bg-red-100 text-red-800 border-red-200", label: "High" },
	};

	const variant = variants[competition] || variants.medium;

	return (
		<Badge variant="outline" className={variant.color}>
			{variant.label}
		</Badge>
	);
};

// Format volume with K/M suffix
const formatVolume = (volume: number): string => {
	if (volume >= 1000000) {
		return `${(volume / 1000000).toFixed(1)}M`;
	}
	if (volume >= 1000) {
		return `${(volume / 1000).toFixed(1)}K`;
	}
	return volume.toString();
};

export default function KeywordsPage() {
	const [keywords, setKeywords] = useState<Keyword[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [keywordToDelete, setKeywordToDelete] = useState<Keyword | null>(null);
	const [reanalyzingId, setReanalyzingId] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

	const fetchKeywords = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const data = await keywordsApi.getKeywords();
			setKeywords(data || []);
		} catch (err) {
			setError("Failed to load keywords. Please try again.");
			console.error("Error fetching keywords:", err);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchKeywords();
	}, [fetchKeywords]);

	const handleReanalyze = async (keyword: Keyword) => {
		try {
			setReanalyzingId(keyword.keywordId);
			const updated = await keywordsApi.reanalyzeKeyword(keyword.keywordId);
			setKeywords((prev) =>
				prev.map((k) => (k.keywordId === keyword.keywordId ? updated : k))
			);
			toast.success("Keyword reanalyzed successfully");
		} catch (err) {
			toast.error("Failed to reanalyze keyword");
			console.error("Error reanalyzing keyword:", err);
		} finally {
			setReanalyzingId(null);
		}
	};

	const handleDeleteClick = (keyword: Keyword) => {
		setKeywordToDelete(keyword);
		setIsDeleteDialogOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!keywordToDelete) return;

		try {
			setDeletingId(keywordToDelete.keywordId);
			await keywordsApi.deleteKeyword(keywordToDelete.keywordId);
			setKeywords((prev) =>
				prev.filter((k) => k.keywordId !== keywordToDelete.keywordId)
			);
			toast.success("Keyword deleted successfully");
		} catch (err) {
			toast.error("Failed to delete keyword");
			console.error("Error deleting keyword:", err);
		} finally {
			setDeletingId(null);
			setIsDeleteDialogOpen(false);
			setKeywordToDelete(null);
		}
	};

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedIds(new Set(keywords.map((k) => k.keywordId)));
		} else {
			setSelectedIds(new Set());
		}
	};

	const handleSelectOne = (keywordId: string, checked: boolean) => {
		const newSelected = new Set(selectedIds);
		if (checked) {
			newSelected.add(keywordId);
		} else {
			newSelected.delete(keywordId);
		}
		setSelectedIds(newSelected);
	};

	const handleDeleteSelected = async () => {
		if (selectedIds.size === 0) return;

		try {
			setIsDeletingMultiple(true);
			await keywordsApi.deleteMultipleKeywords(Array.from(selectedIds));
			setKeywords((prev) =>
				prev.filter((k) => !selectedIds.has(k.keywordId))
			);
			setSelectedIds(new Set());
			toast.success(`${selectedIds.size} keyword${selectedIds.size > 1 ? "s" : ""} deleted successfully`);
		} catch (err) {
			toast.error("Failed to delete keywords");
			console.error("Error deleting keywords:", err);
		} finally {
			setIsDeletingMultiple(false);
		}
	};

	// Calculate stats
	const stats = {
		total: keywords.length,
		lowCompetition: keywords.filter((k) => k.competition === "low").length,
		highVolume: keywords.filter((k) => k.volume >= 1000).length,
		analyzed: keywords.filter((k) => k.isAnalyzed).length,
	};

	return (
		<TooltipProvider>
			<div className="space-y-6">
				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-muted-foreground">Total Keywords</p>
									<p className="text-2xl font-bold">{stats.total}</p>
								</div>
								<Key className="h-8 w-8 text-muted-foreground" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-muted-foreground">Low Competition</p>
									<p className="text-2xl font-bold text-green-600">{stats.lowCompetition}</p>
								</div>
								<Target className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-muted-foreground">High Volume (1K+)</p>
									<p className="text-2xl font-bold text-blue-600">{stats.highVolume}</p>
								</div>
								<TrendingUp className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-muted-foreground">Analyzed</p>
									<p className="text-2xl font-bold text-purple-600">{stats.analyzed}</p>
								</div>
								<BarChart3 className="h-8 w-8 text-purple-500" />
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Main Card */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="flex items-center gap-2">
									<Key className="h-5 w-5" />
									Keywords
								</CardTitle>
								<CardDescription>
									Manage and analyze your SEO keywords
								</CardDescription>
							</div>
							<div className="flex items-center gap-2">
								{selectedIds.size > 0 && (
									<Button
										variant="destructive"
										size="sm"
										onClick={handleDeleteSelected}
										disabled={isDeletingMultiple}
									>
										{isDeletingMultiple ? (
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										) : (
											<Trash2 className="h-4 w-4 mr-2" />
										)}
										Delete ({selectedIds.size})
									</Button>
								)}
								<Button
									variant="outline"
									size="sm"
									onClick={fetchKeywords}
									disabled={isLoading}
								>
									<RefreshCw
										className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
									/>
									Refresh
								</Button>
								<Button size="sm" onClick={() => setIsAddModalOpen(true)}>
									<Plus className="h-4 w-4 mr-2" />
									Add Keywords
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="flex items-center justify-center py-12">
								<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
							</div>
						) : error ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<AlertCircle className="h-12 w-12 text-red-400 mb-4" />
								<p className="text-gray-600">{error}</p>
								<Button variant="outline" className="mt-4" onClick={fetchKeywords}>
									Try Again
								</Button>
							</div>
						) : keywords.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<Key className="h-12 w-12 text-gray-300 mb-4" />
								<p className="text-gray-600">No keywords found</p>
								<p className="text-sm text-gray-400 mt-1">
									Click &quot;Add Keywords&quot; to get started
								</p>
								<Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
									<Plus className="h-4 w-4 mr-2" />
									Add Keywords
								</Button>
							</div>
						) : (
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-12">
												<Checkbox
													checked={selectedIds.size === keywords.length && keywords.length > 0}
													onCheckedChange={handleSelectAll}
												/>
											</TableHead>
											<TableHead>Keyword</TableHead>
											<TableHead>
												<Tooltip>
													<TooltipTrigger className="flex items-center gap-1">
														Competition
														<AlertCircle className="h-3 w-3 text-muted-foreground" />
													</TooltipTrigger>
													<TooltipContent className="max-w-xs">
														<p>
															How hard it is to rank on Google&apos;s first page. Low
															competition keywords are easier to rank for.
														</p>
													</TooltipContent>
												</Tooltip>
											</TableHead>
											<TableHead>
												<Tooltip>
													<TooltipTrigger className="flex items-center gap-1">
														Volume
														<AlertCircle className="h-3 w-3 text-muted-foreground" />
													</TooltipTrigger>
													<TooltipContent className="max-w-xs">
														<p>
															Average monthly searches on Google. Higher volume
															means more potential visitors to your article.
														</p>
													</TooltipContent>
												</Tooltip>
											</TableHead>
											<TableHead>Recommended Title</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{keywords.map((keyword) => (
											<TableRow key={keyword.keywordId}>
												<TableCell>
													<Checkbox
														checked={selectedIds.has(keyword.keywordId)}
														onCheckedChange={(checked) =>
															handleSelectOne(keyword.keywordId, checked as boolean)
														}
													/>
												</TableCell>
												<TableCell className="font-medium">
													{keyword.keyword}
												</TableCell>
												<TableCell>
													<CompetitionBadge competition={keyword.competition} />
												</TableCell>
												<TableCell>
													<span className="font-mono">
														{formatVolume(keyword.volume)}
													</span>
													<span className="text-xs text-muted-foreground ml-1">
														/mo
													</span>
												</TableCell>
												<TableCell className="max-w-xs">
													{keyword.recommendedTitle ? (
														<Tooltip>
															<TooltipTrigger className="text-left truncate block max-w-52">
																{keyword.recommendedTitle}
															</TooltipTrigger>
															<TooltipContent className="max-w-sm">
																<p>{keyword.recommendedTitle}</p>
															</TooltipContent>
														</Tooltip>
													) : (
														<span className="text-muted-foreground">-</span>
													)}
												</TableCell>
												<TableCell>
													{keyword.isAnalyzed ? (
														<Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
															Analyzed
														</Badge>
													) : (
														<Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
															<Loader2 className="h-3 w-3 mr-1 animate-spin" />
															Analyzing
														</Badge>
													)}
												</TableCell>
												<TableCell className="text-right">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="sm">
																<MoreHorizontal className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																onClick={() => handleReanalyze(keyword)}
																disabled={reanalyzingId === keyword.keywordId}
															>
																{reanalyzingId === keyword.keywordId ? (
																	<Loader2 className="h-4 w-4 mr-2 animate-spin" />
																) : (
																	<RefreshCw className="h-4 w-4 mr-2" />
																)}
																Reanalyze
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() => handleDeleteClick(keyword)}
																className="text-red-600"
																disabled={deletingId === keyword.keywordId}
															>
																{deletingId === keyword.keywordId ? (
																	<Loader2 className="h-4 w-4 mr-2 animate-spin" />
																) : (
																	<Trash2 className="h-4 w-4 mr-2" />
																)}
																Delete
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Add Keywords Modal */}
				<AddKeywordsModal
					open={isAddModalOpen}
					onOpenChange={setIsAddModalOpen}
					onSuccess={fetchKeywords}
				/>

				{/* Delete Confirmation Dialog */}
				<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete Keyword</AlertDialogTitle>
							<AlertDialogDescription>
								Are you sure you want to delete the keyword &quot;{keywordToDelete?.keyword}&quot;?
								This action cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleConfirmDelete}
								className="bg-red-600 hover:bg-red-700"
								disabled={!!deletingId}
							>
								{deletingId ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Deleting...
									</>
								) : (
									"Delete"
								)}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</TooltipProvider>
	);
}
