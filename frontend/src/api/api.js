import axios from 'axios';

const baseURL =
    process.env.NODE_ENV === 'production'
        ? 'https://risk.wasatradfallning.com'
        : 'http://localhost:4000';


// Create an Axios instance with the base URL of your backend API
const api = axios.create({
    baseURL,
});

// Axios Interceptor for handling token expiration
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const response = await axios.post('http://localhost:4000/auth/refresh', { refreshToken });

                // Update access token
                const { accessToken } = response.data;
                localStorage.setItem('accessToken', accessToken);

                // Retry the original request with the new token
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                console.error('Failed to refresh token:', refreshError);
                window.location.href = '/login'; // Redirect to login if refresh fails
            }
        }

        return Promise.reject(error);
    }
);

export default api;
