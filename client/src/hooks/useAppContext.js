import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

/**
 * Custom hook to use AppContext
 * @returns {Object} AppContext value
 */
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
};

export default useAppContext;
