import axios from 'axios';

// Create an Axios instance with the base URL of your backend API
const api = axios.create({
    baseURL: 'https://risk.wasatradfallning.com', // Replace with your backend URL if different
    //baseURL: 'http://localhost:4000', // Replace with your backend URL if different
});

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
    (response) => response, // If the response is fine, just return it
    (error) => {
        // Check if the error response exists and its status is 403
        if (error.response && error.response.status === 403) {
            // Log out the user by removing the stored token
            localStorage.removeItem('token');
            // Optionally, you can remove any other related user info
            // Redirect the user to the login page
            window.location.href = '/login';
        }
        // Reject the error so that the calling code can handle it too if needed
        return Promise.reject(error);
    }
);

export default api;
