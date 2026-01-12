import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function AnimatedRobot({ mood = 'idle', size = 'md' }) {
    const [isBlinking, setIsBlinking] = useState(false)

    // Random blinking effect
    useEffect(() => {
        const blinkInterval = setInterval(() => {
            setIsBlinking(true)
            setTimeout(() => setIsBlinking(false), 200)
        }, Math.random() * 4000 + 2000)

        return () => clearInterval(blinkInterval)
    }, [])

    const sizes = {
        sm: { container: 'w-12 h-12', head: 'w-8 h-8', eye: 'w-1.5 h-1.5', antenna: 'w-1 h-2' },
        md: { container: 'w-16 h-16', head: 'w-12 h-12', eye: 'w-2 h-2', antenna: 'w-1.5 h-3' },
        lg: { container: 'w-24 h-24', head: 'w-18 h-18', eye: 'w-3 h-3', antenna: 'w-2 h-4' }
    }

    const currentSize = sizes[size]

    // Animation variants based on mood
    const headVariants = {
        idle: {
            y: [0, -4, 0],
            rotate: [0, 2, -2, 0],
            transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        },
        talking: {
            y: [0, -2, 0, -2, 0],
            scale: [1, 1.02, 1, 1.02, 1],
            transition: { duration: 0.8, repeat: Infinity }
        },
        thinking: {
            rotate: [-5, 5, -5],
            transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
        },
        happy: {
            y: [0, -8, 0],
            rotate: [0, 5, -5, 0],
            transition: { duration: 0.6, repeat: Infinity }
        }
    }

    const antennaVariants = {
        idle: {
            rotate: [0, 10, -10, 0],
            transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        },
        talking: {
            rotate: [0, 15, -15, 0],
            transition: { duration: 0.5, repeat: Infinity }
        },
        thinking: {
            rotate: [0, 20, 0],
            scale: [1, 1.2, 1],
            transition: { duration: 1, repeat: Infinity }
        }
    }

    return (
        <div className={`relative ${currentSize.container} flex items-center justify-center`}>
            {/* Glow Effect */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-bright-teal to-soft-violet rounded-full blur-xl"
            />

            {/* Robot Container */}
            <div className="relative">
                {/* Antenna */}
                <motion.div
                    variants={antennaVariants}
                    animate={mood}
                    className="absolute -top-2 left-1/2 -translate-x-1/2 flex flex-col items-center"
                >
                    <motion.div
                        animate={{
                            scale: mood === 'thinking' ? [1, 1.5, 1] : 1,
                            opacity: mood === 'thinking' ? [0.5, 1, 0.5] : 1
                        }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className={`${currentSize.antenna.split(' ')[0]} h-1 bg-gradient-to-r from-bright-teal to-soft-violet rounded-full`}
                    />
                    <div className={`${currentSize.antenna} bg-gradient-to-b from-bright-teal to-soft-violet rounded-full`} />
                </motion.div>

                {/* Head */}
                <motion.div
                    variants={headVariants}
                    animate={mood}
                    className={`${currentSize.head} bg-gradient-to-br from-bright-teal via-soft-violet to-accent-yellow rounded-2xl shadow-2xl relative overflow-hidden border-2 border-white/20`}
                >
                    {/* Shine Effect */}
                    <motion.div
                        animate={{
                            x: ['-100%', '200%']
                        }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                    />

                    {/* Face */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {/* Eyes */}
                        <div className="flex gap-2">
                            <motion.div
                                animate={{
                                    scaleY: isBlinking ? 0.1 : 1,
                                    backgroundColor: mood === 'happy' ? '#10b981' : '#ffffff'
                                }}
                                transition={{ duration: 0.1 }}
                                className={`${currentSize.eye} bg-white rounded-full shadow-inner`}
                            >
                                {/* Pupil */}
                                <motion.div
                                    animate={{
                                        x: mood === 'thinking' ? [0, 2, -2, 0] : 0,
                                        y: mood === 'talking' ? [0, 1, 0] : 0
                                    }}
                                    transition={{ duration: mood === 'thinking' ? 2 : 0.5, repeat: Infinity }}
                                    className="w-1/2 h-1/2 bg-gray-800 rounded-full m-auto mt-1"
                                />
                            </motion.div>
                            <motion.div
                                animate={{
                                    scaleY: isBlinking ? 0.1 : 1,
                                    backgroundColor: mood === 'happy' ? '#10b981' : '#ffffff'
                                }}
                                transition={{ duration: 0.1 }}
                                className={`${currentSize.eye} bg-white rounded-full shadow-inner`}
                            >
                                {/* Pupil */}
                                <motion.div
                                    animate={{
                                        x: mood === 'thinking' ? [0, 2, -2, 0] : 0,
                                        y: mood === 'talking' ? [0, 1, 0] : 0
                                    }}
                                    transition={{ duration: mood === 'thinking' ? 2 : 0.5, repeat: Infinity }}
                                    className="w-1/2 h-1/2 bg-gray-800 rounded-full m-auto mt-1"
                                />
                            </motion.div>
                        </div>
                    </div>

                    {/* Mouth */}
                    <motion.div
                        animate={{
                            scaleX: mood === 'talking' ? [1, 1.2, 1] : mood === 'happy' ? 1.3 : 1,
                            scaleY: mood === 'talking' ? [1, 0.8, 1] : mood === 'happy' ? 0.8 : 1
                        }}
                        transition={{ duration: mood === 'talking' ? 0.3 : 0.5, repeat: mood === 'talking' ? Infinity : 0 }}
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-2 border-b-2 border-white rounded-full"
                        style={{
                            borderBottomLeftRadius: mood === 'happy' ? '100%' : '50%',
                            borderBottomRightRadius: mood === 'happy' ? '100%' : '50%'
                        }}
                    />

                    {/* Cheeks (when happy) */}
                    {mood === 'happy' && (
                        <>
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                className="absolute bottom-3 left-1 w-2 h-2 bg-pink-400 rounded-full blur-sm"
                            />
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                className="absolute bottom-3 right-1 w-2 h-2 bg-pink-400 rounded-full blur-sm"
                            />
                        </>
                    )}
                </motion.div>

                {/* Body (optional, for larger sizes) */}
                {size !== 'sm' && (
                    <motion.div
                        animate={{
                            scaleY: mood === 'talking' ? [1, 1.05, 1] : 1
                        }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="absolute top-full left-1/2 -translate-x-1/2 w-8 h-6 bg-gradient-to-b from-soft-violet to-bright-teal rounded-b-xl mt-1 border-2 border-white/20"
                    >
                        {/* LED Indicator */}
                        <motion.div
                            animate={{
                                opacity: [0.3, 1, 0.3],
                                scale: [0.8, 1, 0.8]
                            }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-eco-green rounded-full shadow-lg shadow-eco-green/50"
                        />
                    </motion.div>
                )}
            </div>

            {/* Floating Particles (when thinking) */}
            {mood === 'thinking' && (
                <>
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: 0, opacity: 0 }}
                            animate={{
                                y: [-20, -40],
                                opacity: [0, 1, 0],
                                x: [0, (i - 1) * 10]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.3
                            }}
                            className="absolute top-0 left-1/2 w-1 h-1 bg-bright-teal rounded-full"
                        />
                    ))}
                </>
            )}
        </div>
    )
}
