import axios from 'axios';

// Create Axios instance
const api = axios.create({
    baseURL: 'https://risk.wasatradfallning.com', // Replace with your backend URL
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
                const response = await axios.post('https://risk.wasatradfallning.com/auth/refresh', { refreshToken });

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
