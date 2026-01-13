'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { onboardingApi } from '@/lib/api/onboarding.api';
import { cn } from '@/lib/utils';
import { useWebsiteStore } from '@/stores/website.store';
import { Check, ChevronsUpDown, LoaderCircle, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { WebsiteOnboarding } from './WebsiteOnboarding';

export function WebsiteDropdown() {
    const websites = useWebsiteStore(state => state.websites);
    const currentWebsite = useWebsiteStore(state => state.currentWebsite);
    const isSwitchingWebsite = useWebsiteStore(state => state.isSwitchingWebsite);
    const setWebsites = useWebsiteStore(state => state.setWebsites);
    const setCurrentWebsite = useWebsiteStore(state => state.setCurrentWebsite);
    const setIsSwitchingWebsite = useWebsiteStore(state => state.setIsSwitchingWebsite);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);


    useEffect(() => {
        async function fetchData() {
            const response = await onboardingApi.getAllUserWebsites();
            console.log('Websites in store updated:', response.length);
            if (response.length > 0 && !currentWebsite) {
                const defaultWebsite = response[0];
                setCurrentWebsite(defaultWebsite);
            }


            if (currentWebsite && response.length > 0) {
                const websiteExists = response.some(w => w.websiteId === currentWebsite.websiteId);
                if (!websiteExists && response.length > 0) {
                    setCurrentWebsite(response[0]);
                }
            }
        }
        fetchData();

    }, [websites, currentWebsite, setCurrentWebsite]);

    const handleWebsiteSwitch = useCallback(async (websiteId: string) => {
        if (currentWebsite?.websiteId === websiteId || isSwitchingWebsite) return;

        const selectedWebsite = websites!.find((page) => page.websiteId === websiteId);
        if (!selectedWebsite) return;

        setIsSwitchingWebsite(true);

        try {
            setCurrentWebsite(selectedWebsite);
            toast.success(`Switched to ${selectedWebsite.websiteName}`);
        } catch (error) {
            console.error('Error switching Website:', error);
            toast.error('Failed to switch website');
        } finally {
            setIsSwitchingWebsite(false);
        }
    }, [currentWebsite?.websiteId, isSwitchingWebsite, websites, setCurrentWebsite, setIsSwitchingWebsite]);

    const handleWebsitesAdded = useCallback(async () => {
        setIsAddOpen(false);
        try {
            const data = await onboardingApi.getAllUserWebsites();

            if (data && data.length > 0) {
                setWebsites(data);
            }
        } catch (error) {
            toast.error('Failed to refresh stores');
        }
    }, [setWebsites]);

    // Memoize website count to prevent re-renders
    const websiteCount = useMemo(() => websites!.length, [websites]);

    // Memoize dropdown items
    const dropdownItems = useMemo(() =>
        websites?.map((page) => ({
            id: page.websiteId,
            name: page.websiteName,
            isCurrent: currentWebsite?.websiteId === page.websiteId
        })),
        [websites, currentWebsite?.websiteId]
    );

    return (
        <>
            {isSwitchingWebsite && (
                <div className='fixed inset-0 z-50 flex flex-col items-center bg-black/30 backdrop-blur-sm min-h-screen w-full justify-center'>
                    <div className="p-5 text-center flex flex-col items-center justify-center bg-white border border-gray-200 rounded-md shadow-lg min-h-40 min-w-52">
                        <LoaderCircle className='size-6 animate-spin text-gray-900' />
                        <p className='text-base text-gray-600 mt-4'>Switching Website</p>
                    </div>
                </div>
            )}

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader className='-mt-4'>
                        <DialogTitle>Add New Website</DialogTitle>
                    </DialogHeader>
                    <Separator />
                    {isAddOpen && (
                        <WebsiteOnboarding
                            mode='add-website'
                            showCloseButton
                            onWebsiteAdded={handleWebsitesAdded}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className='px-3 py-2 inline-flex items-center w-full justify-between transition ease-in-out rounded-md hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-blue-500 '
                        disabled={isSwitchingWebsite}
                    >
                        <span className="text-sm font-normal text-left hover:no-underline w-full line-clamp-1 shrink text-gray-900">
                            {isSwitchingWebsite ? "Switching..." : currentWebsite?.websiteName ?? "Select Websites"}
                        </span>
                        {isSwitchingWebsite ? (
                            <LoaderCircle className='text-gray-500 size-4 animate-spin ml-2' />
                        ) : (
                            <ChevronsUpDown className='text-gray-500 size-4 ml-2 flex-shrink-0' />
                        )}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align={"start"}
                    side={"bottom"}
                    className="w-[230px] bg-white"
                >
                    <DropdownMenuLabel className="text-xs font-medium text-gray-500 px-3 pb-1">
                        Websites ({websiteCount})
                    </DropdownMenuLabel>

                    <ScrollArea className="h-fit max-h-[240px] overflow-y-auto">
                        <div className="p-1">
                            {websites?.length === 0 ? (
                                <div className="text-center py-6 text-sm text-gray-500">
                                    {isLoading ? "Loading..." : "No websites available"}
                                </div>
                            ) : (
                                dropdownItems?.map((item) => (
                                    <DropdownMenuItem
                                        key={item.id}
                                        className={cn(
                                            "flex items-center gap-2 py-2 px-2 cursor-pointer justify-between group rounded-md",
                                            "hover:bg-gray-100",
                                            item.isCurrent && "bg-gray-50",
                                            isSwitchingWebsite && "opacity-50 cursor-not-allowed"
                                        )}
                                        onClick={() => handleWebsiteSwitch(item.id)}
                                        disabled={isSwitchingWebsite}
                                    >
                                        <div className="flex items-center truncate gap-2 flex-1 min-w-0">
                                            <span className="text-sm text-gray-900 truncate whitespace-normal w-full line-clamp-1">
                                                {item.name}
                                            </span>
                                            <div className="w-5 flex-shrink-0">
                                                {item.isCurrent && (
                                                    <Check
                                                        className="h-4 w-4 text-blue-600"
                                                        strokeWidth={2}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </DropdownMenuItem>
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={() => setIsAddOpen(true)}
                        className={cn(
                            "flex items-center gap-2 py-2 px-2 cursor-pointer rounded-md mx-1",
                            "hover:bg-gray-100",
                            isSwitchingWebsite && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={isSwitchingWebsite}
                    >
                        <Plus className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-900">New Website</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}