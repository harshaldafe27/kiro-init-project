import useStore from '../store/useStore';
export const useToast = () => {
    const addToast = useStore((s) => s.addToast);
    return {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        info: (msg) => addToast(msg, 'info'),
    };
};