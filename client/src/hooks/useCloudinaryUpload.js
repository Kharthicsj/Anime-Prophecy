import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Custom hook for Cloudinary image uploads
 */
export const useCloudinaryUpload = () => {
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const uploadImage = useCallback(async (file) => {
        if (!file) {
            setUploadError('No file selected');
            return null;
        }

        setUploading(true);
        setUploadError(null);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                },
            });

            if (response.data.success) {
                return response.data.data;
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Upload failed';
            setUploadError(errorMessage);
            console.error('Upload error:', errorMessage);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }

        return null;
    }, []);

    const uploadImageFromUrl = useCallback(async (imageUrl) => {
        if (!imageUrl) {
            setUploadError('No image URL provided');
            return null;
        }

        setUploading(true);
        setUploadError(null);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/upload/url`,
                { imageUrl },
                { withCredentials: true }
            );

            if (response.data.success) {
                return response.data.data;
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Upload from URL failed';
            setUploadError(errorMessage);
            console.error('Upload error:', errorMessage);
        } finally {
            setUploading(false);
        }

        return null;
    }, []);

    const deleteImage = useCallback(async (publicId) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/upload/${publicId}`, {
                withCredentials: true,
            });

            return response.data.success;
        } catch (err) {
            console.error('Delete error:', err);
            return false;
        }
    }, []);

    return {
        uploadImage,
        uploadImageFromUrl,
        deleteImage,
        uploading,
        uploadError,
        uploadProgress,
    };
};

export default useCloudinaryUpload;
