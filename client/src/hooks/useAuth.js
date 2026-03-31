import useStore from '../store/useStore';
export const useAuth = () => {
    const user = useStore((s) => s.user);
    const accessToken = useStore((s) => s.accessToken);
    const setAuth = useStore((s) => s.setAuth);
    const clearAuth = useStore((s) => s.clearAuth);
    return {
        user,
        accessToken,
        setAuth,
        clearAuth,
        isAuthenticated: !!accessToken
    };
};