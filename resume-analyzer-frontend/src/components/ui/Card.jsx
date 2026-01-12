import { motion } from 'framer-motion';

const Card = ({
    children,
    className = '',
    hoverEffect = false,
    glowBorder = false,
    loading = false,
    ...props
}) => {
    if (loading) {
        return (
            <div className={`bg-glass-black backdrop-blur-xl border border-white/5 rounded-2xl p-6 ${className}`}>
                <div className="space-y-4">
                    <div className="h-4 bg-slate-700 rounded skeleton w-3/4"></div>
                    <div className="h-4 bg-slate-700 rounded skeleton w-1/2"></div>
                    <div className="h-20 bg-slate-700 rounded skeleton"></div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`
        bg-glass-black backdrop-blur-xl border border-white/5 shadow-glass rounded-2xl 
        relative overflow-hidden p-6
        ${hoverEffect ? 'hover:border-white/10 hover:shadow-glass-hover hover:-translate-y-1 transition-all duration-300' : ''}
        ${glowBorder ? 'glow-border' : ''}
        ${className}
      `}
            {...props}
        >
            {/* Glow effect background */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-electric-violet/10 rounded-full blur-3xl pointer-events-none" />
            {glowBorder && (
                <div className="absolute inset-0 bg-gradient-to-br from-electric-violet/5 via-transparent to-bright-teal/5 pointer-events-none" />
            )}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};

export default Card;

