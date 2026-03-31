import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
    withCredentials: true,
});

// Attach access token
api.interceptors.request.use((config) => {
    const token = window.__accessToken__;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Refresh on 401
let refreshing = false;
let queue = [];

api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config;
        if (err.response && err.response.status === 401 && !original._retry) {
            if (refreshing) {
                return new Promise((resolve, reject) =>
                    queue.push({
                        resolve,
                        reject
                    })
                ).then(() => api(original));
            }
            original._retry = true;
            refreshing = true;
            try {
                const {
                    data
                } = await axios.post(
                    `${api.defaults.baseURL}/auth/refresh`, {}, {
                        withCredentials: true
                    }
                );
                window.__accessToken__ = data.data.accessToken;
                queue.forEach(({
                    resolve
                }) => resolve());
                queue = [];
                return api(original);
            } catch (_) {
                queue.forEach(({
                    reject
                }) => reject());
                queue = [];
                window.__accessToken__ = null;
                window.location.href = '/login';
            } finally {
                refreshing = false;
            }
        }
        return Promise.reject(err);
    }
);

export default api;