"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserWebsite } from "@/lib/api/onboarding.api";
import {
    ChevronRight,
    Ellipsis,
    Loader2,
    Plus,
    Trash2
} from "lucide-react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { memo } from "react";

// Extract Website Card Component to prevent re-renders of all cards
export const WebsiteCard = memo(({
    website,
    onDeleteClick,
    isDeletingPageId,
    router
}: {
    website: UserWebsite;
    onDeleteClick: (website: UserWebsite) => void;
    isDeletingPageId: string | null;
    router: AppRouterInstance;
}) => {
    return (
        <Card>
            <CardContent>
                <CardTitle className="text-[14px] font-medium mb-2 truncate">
                    {website.websiteName}
                </CardTitle>
                <CardDescription>
                    <div className="my-5 flex items-center justify-between">
                        <p className="text-sm text-gray-600">Scrapping Status:</p>
                        <Badge className="text-center pb-1">
                            {website.scrapingStatus}
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => {
                                router.push(`/dashboard/websites/${website.websiteId}`);
                            }}
                        >
                            View Website
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <Ellipsis className="h-4 w-4 ml-2 cursor-pointer" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>View</DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onDeleteClick(website)}
                                    className="text-red-600 focus:text-red-600"
                                    disabled={isDeletingPageId === website.websiteId}
                                >
                                    {isDeletingPageId === website.websiteId ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4 mr-2" />
                                    )}
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardDescription>
            </CardContent>
        </Card>
    );
});

WebsiteCard.displayName = 'WebsiteCard';

// Add New Website Card Component
export const AddWebsiteCard = memo(({ onAddClick }: { onAddClick: () => void }) => (
    <Card>
        <CardContent>
            <div 
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center h-full cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={onAddClick}
            >
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                    <Plus className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-600">Add New Website</p>
            </div>
        </CardContent>
    </Card>
));

AddWebsiteCard.displayName = 'AddWebsiteCard';