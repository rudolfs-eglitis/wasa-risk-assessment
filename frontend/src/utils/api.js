import axios from 'axios';

const baseURL =
    process.env.NODE_ENV === 'production'
        ? 'https://risk.wasatradfallning.com'
        : 'http://localhost:4000';

// Create an Axios instance with the base URL of your backend API
const api = axios.create({
    baseURL,
});

// Request interceptor to automatically attach the Authorization header
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        console.log("Token from localStorage:", token); // Temporary log to verify token presence
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // For debugging:
            console.log('Authorization header attached:', config.headers.Authorization);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
    (response) => response, // Return the response if no error occurs
    (error) => {
        // If a 403 error is returned, clear token and redirect to login
        if (error.response && error.response.status === 403) {
            //localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
