import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'md', color = 'electric-violet', className = '' }) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    };

    const colors = {
        'electric-violet': 'border-electric-violet',
        'bright-teal': 'border-bright-teal',
        'white': 'border-white',
        'neon-pink': 'border-neon-pink',
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex items-center justify-center ${className}`}
        >
            <div
                className={`
                    ${sizes[size]} 
                    border-4 
                    ${colors[color]} 
                    border-t-transparent 
                    rounded-full 
                    animate-spin
                `}
            />
        </motion.div>
    );
};

export const LoadingScreen = ({ message = 'Loading...' }) => {
    return (
        <div className="fixed inset-0 bg-deep-navy flex items-center justify-center z-50">
            <div className="text-center">
                <LoadingSpinner size="xl" />
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 text-gray-400 text-lg"
                >
                    {message}
                </motion.p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
