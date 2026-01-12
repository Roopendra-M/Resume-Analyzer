import { motion } from 'framer-motion';
import { useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

const Input = ({
    label,
    error,
    success,
    warning,
    icon,
    className = '',
    containerClassName = '',
    maxLength,
    showCounter = false,
    floatingLabel = false,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [value, setValue] = useState(props.value || '');

    const handleChange = (e) => {
        setValue(e.target.value);
        if (props.onChange) props.onChange(e);
    };

    const getValidationIcon = () => {
        if (success) return <CheckCircle2 className="w-4 h-4 text-green-400" />;
        if (error) return <AlertCircle className="w-4 h-4 text-red-400" />;
        if (warning) return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
        return null;
    };

    const getBorderColor = () => {
        if (error) return 'border-red-500 focus:border-red-500 focus:ring-red-500';
        if (success) return 'border-green-500 focus:border-green-500 focus:ring-green-500';
        if (warning) return 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500';
        return 'border-slate-700 focus:border-electric-violet focus:ring-electric-violet';
    };

    return (
        <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
            {label && !floatingLabel && (
                <label className="text-sm font-medium text-lavender-gray ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <motion.input
                    initial={false}
                    whileFocus={{ scale: 1.01 }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`
            w-full bg-deep-navy/50 border rounded-xl px-5 py-3 
            text-white placeholder-slate-500 
            focus:outline-none focus:ring-1 
            transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-11' : ''}
            ${(success || error || warning) ? 'pr-11' : ''}
            ${getBorderColor()}
            ${className}
          `}
                    maxLength={maxLength}
                    value={value}
                    onChange={handleChange}
                    {...props}
                />
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {icon}
                    </div>
                )}
                {getValidationIcon() && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {getValidationIcon()}
                    </div>
                )}
                {floatingLabel && label && (
                    <motion.label
                        initial={false}
                        animate={{
                            top: isFocused || value ? '0.25rem' : '50%',
                            fontSize: isFocused || value ? '0.75rem' : '1rem',
                            translateY: isFocused || value ? '0' : '-50%',
                        }}
                        className="absolute left-5 text-slate-400 pointer-events-none transition-all duration-200 bg-deep-navy px-1"
                    >
                        {label}
                    </motion.label>
                )}
            </div>
            {showCounter && maxLength && (
                <div className="text-xs text-slate-500 text-right">
                    {value.length}/{maxLength}
                </div>
            )}
            {error && (
                <span className="text-sm text-red-500 ml-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </span>
            )}
            {success && (
                <span className="text-sm text-green-500 ml-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {success}
                </span>
            )}
            {warning && (
                <span className="text-sm text-yellow-500 ml-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {warning}
                </span>
            )}
        </div>
    );
};

export default Input;

