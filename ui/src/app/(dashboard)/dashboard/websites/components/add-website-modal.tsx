

import { WebsiteOnboarding } from '@/components/WebsiteOnboarding';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText } from 'lucide-react';

interface AddWebsiteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onWebsiteAdded?: () => void;
}

export const AddWebsiteModal = ({ open, onOpenChange, onWebsiteAdded }: AddWebsiteModalProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl! max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Add New Website
                    </DialogTitle>
                    <DialogDescription>
                        Add a new website to start tracking its SEO performance and gain valuable insights.
                    </DialogDescription>
                </DialogHeader>


                <WebsiteOnboarding mode='add-website'
                    onWebsiteAdded={onWebsiteAdded}
                    onClose={() => onOpenChange(false)}
                    showCloseButton />
            </DialogContent>
        </Dialog>
    )
}
