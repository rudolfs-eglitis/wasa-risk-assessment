import api from "../utils/api.js";


export const isAuthenticated = async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const response = await api.get('/auth/validate', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.valid;
    } catch (error) {
        console.error('Token validation failed:', error.response?.data || error.message);
        return false;
    }
};
