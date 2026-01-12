import { motion } from 'framer-motion';
import { useState } from 'react';

const Button = ({
    children,
    variant = 'primary',
    className = '',
    icon = null,
    iconPosition = 'left',
    isLoading = false,
    ...props
}) => {
    const [ripples, setRipples] = useState([]);

    const baseStyles = "relative inline-flex items-center justify-center font-bold transition-all duration-300 rounded-xl focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden";

    const variants = {
        primary: "bg-electric-violet text-white hover:shadow-neon hover:bg-electric-violet/90 focus:ring-electric-violet/50",
        secondary: "bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 focus:ring-white/20",
        danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/50",
        ghost: "text-lavender-gray hover:text-white hover:bg-white/5",
        glow: "bg-gradient-to-r from-electric-violet to-bright-teal text-white hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] border-0",
        outline: "bg-transparent border-2 border-electric-violet text-electric-violet hover:bg-electric-violet hover:text-white"
    };

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
    };

    const sizeClass = props.size ? sizes[props.size] : sizes.md;

    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newRipple = { x, y, id: Date.now() };
        setRipples([...ripples, newRipple]);

        setTimeout(() => {
            setRipples(ripples => ripples.filter(r => r.id !== newRipple.id));
        }, 600);

        if (props.onClick) props.onClick(e);
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`${baseStyles} ${variants[variant]} ${sizeClass} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
            onClick={handleClick}
        >
            {/* Ripple Effect */}
            {ripples.map(ripple => (
                <span
                    key={ripple.id}
                    className="absolute bg-white/30 rounded-full animate-ping"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: 20,
                        height: 20,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            ))}

            {/* Content */}
            <span className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                    <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : icon && iconPosition === 'left' && (
                    <span>{icon}</span>
                )}
                {children}
                {icon && iconPosition === 'right' && !isLoading && (
                    <span>{icon}</span>
                )}
            </span>
        </motion.button>
    );
};

export default Button;
