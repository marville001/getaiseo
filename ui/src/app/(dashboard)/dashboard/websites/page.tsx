"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { onboardingApi, UserWebsite } from "@/lib/api/onboarding.api";
import { useWebsiteStore } from "@/stores/website.store";
import { AlertCircle, Link2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { AddWebsiteModal } from "./components/add-website-modal";
import { AddWebsiteCard, WebsiteCard } from "./components/website-card";

export default function WebsitePagesPage() {
    const [pages, setPages] = useState<UserWebsite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [pageToDelete, setPageToDelete] = useState<UserWebsite | null>(null);
    const [isDeletingPageId, setIsDeletingPageId] = useState<string | null>(null);

    const setWebsites = useWebsiteStore(state => state.setWebsites);
    const setCurrentWebsite = useWebsiteStore(state => state.setCurrentWebsite);

    const currentWebsite = useWebsiteStore(state => state.currentWebsite);

    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await onboardingApi.getAllUserWebsites();

                if (!isMounted) return;

                const websites = response || [];
                setPages(websites);
                setWebsites(websites);

                if (websites.length > 0 && !currentWebsite) {
                    setCurrentWebsite(websites[0]);
                }
            } catch (err) {
                if (!isMounted) return;
                setError("Failed to load websites. Please try again.");
                console.error("Error fetching websites:", err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [setWebsites, setCurrentWebsite, currentWebsite]); 

    const handleDeleteClick = useCallback((website: UserWebsite) => {
        setPageToDelete(website);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!pageToDelete) return;

        try {
            setIsDeletingPageId(pageToDelete.websiteId);
            await onboardingApi.deleteWebsite(pageToDelete.websiteId);

            // Update local state and store
            setPages((prev: UserWebsite[]) => {
                const newPages = prev.filter(p => p.websiteId !== pageToDelete.websiteId);
                setWebsites(newPages);
                return newPages;
            });

            // If current website was deleted, update it
            if (currentWebsite?.websiteId === pageToDelete.websiteId) {
                const remainingPages = pages.filter(p => p.websiteId !== pageToDelete.websiteId);
                if (remainingPages.length > 0) {
                    setCurrentWebsite(remainingPages[0]);
                } else {
                    setCurrentWebsite(null);
                }
            }

            toast.success("Website deleted successfully");
        } catch (err) {
            toast.error("Failed to delete website");
            console.error("Error deleting website:", err);
        } finally {
            setIsDeletingPageId(null);
            setIsDeleteDialogOpen(false);
            setPageToDelete(null);
        }
    }, [pageToDelete, pages, currentWebsite, setWebsites, setCurrentWebsite]);

    const hasPages = useMemo(() => pages && pages.length > 0, [pages]);

    const websiteCards = useMemo(() =>
        pages.map((website: UserWebsite) => (
            <WebsiteCard
                key={website.websiteId}
                website={website}
                onDeleteClick={handleDeleteClick}
                isDeletingPageId={isDeletingPageId}
                router={router}
            />
        )),
        [pages, handleDeleteClick, isDeletingPageId, router]
    );

    // Memoize the main content to prevent re-renders
    const mainContent = useMemo(() => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                    <p className="text-gray-600">{error}</p>
                </div>
            );
        }

        if (!hasPages) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Link2 className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-600">No pages found</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Pages will appear here after website scraping
                    </p>
                </div>
            );
        }

        return (
            <div className="rounded-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AddWebsiteCard onAddClick={() => setIsViewModalOpen(true)} />
                {websiteCards}
            </div>
        );
    }, [isLoading, error, hasPages, websiteCards]);

    return (
        <TooltipProvider>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Link2 className="h-5 w-5" />
                                    Websites
                                </CardTitle>
                                <CardDescription>
                                    View and manage all your websites
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {mainContent}
                    </CardContent>
                </Card>

                <AddWebsiteModal
                    open={isViewModalOpen}
                    onOpenChange={setIsViewModalOpen}
                    onWebsiteAdded={() => {
                        onboardingApi.getAllUserWebsites()
                            .then((data: UserWebsite[]) => {
                                setPages(data || []);
                                setWebsites(data || []);
                            });

                    }}
                />

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will soft delete the website &quot;{pageToDelete?.websiteName || pageToDelete?.websiteUrl}&quot;.
                                The data will be marked as deleted but can be recovered if needed.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)} disabled={!!isDeletingPageId}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmDelete}
                                disabled={!!isDeletingPageId}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {isDeletingPageId ? (
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