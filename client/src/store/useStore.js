import {
    create
} from 'zustand';

const useStore = create((set) => ({
    // Auth slice
    user: null,
    accessToken: null,
    setAuth: (user, accessToken) => set({
        user,
        accessToken
    }),
    clearAuth: () => set({
        user: null,
        accessToken: null
    }),

    // Theme slice
    isDark: localStorage.getItem('theme') === 'dark',
    toggleTheme: () =>
        set((s) => {
            const next = !s.isDark;
            localStorage.setItem('theme', next ? 'dark' : 'light');
            document.documentElement.classList.toggle('dark', next);
            return {
                isDark: next
            };
        }),

    // Toast slice
    toasts: [],
    addToast: (message, type = 'info') =>
        set((s) => ({
            toasts: [...s.toasts, {
                id: Date.now(),
                message,
                type
            }],
        })),
    removeToast: (id) =>
        set((s) => ({
            toasts: s.toasts.filter((t) => t.id !== id)
        })),
}));

export default useStore;