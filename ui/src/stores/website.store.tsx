import { UserWebsite } from '@/lib/api/onboarding.api';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface WebsiteState {
    websites: UserWebsite[] | null;
    currentWebsite: UserWebsite | null;
    isLoading: boolean;
    isSwitchingWebsite: boolean;
    error: string | null;
    setWebsites: (websites: UserWebsite[] | []) => void;
    setCurrentWebsite: (website: UserWebsite | null) => void;
    setIsSwitchingWebsite: (isSwitching: boolean) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearWebsites: () => void;
}

export const useWebsiteStore = create<WebsiteState>()(
    devtools(
        persist(
            (set) => ({
                websites: null,
                isLoading: false,
                currentWebsite: null,
                isSwitchingWebsite: false,
                error: null,
                setWebsites: (websites) => set({ websites, error: null }),
                setCurrentWebsite: (website) => set({ currentWebsite: website, error: null }),
                setIsSwitchingWebsite: ((isSwitching: boolean) => set({ isSwitchingWebsite: isSwitching })),
                setLoading: (isLoading) => set({ isLoading }),
                setError: (error) => set({ error }),
                clearWebsites: () => set({ websites: null, error: null }),
            }),
            {
                name: 'website-storage',
                partialize: (state) => ({ websites: state.websites }),
                migrate: (persistedState) => persistedState
            }
        ),
        {
            name: 'website-store',
        }
    )
);