import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Check, ExternalLink, Trash2 } from 'lucide-react'
import api from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [showDropdown, setShowDropdown] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetchNotifications()
        fetchUnreadCount()

        // Poll for new notifications every 30 seconds
        const interval = setInterval(() => {
            fetchUnreadCount()
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const { data } = await api.get('/notifications/')
            setNotifications(data || [])
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchUnreadCount = async () => {
        try {
            const { data } = await api.get('/notifications/unread-count')
            setUnreadCount(data.unread_count || 0)
        } catch (error) {
            console.error('Failed to fetch unread count:', error)
        }
    }

    const markAsRead = async (notificationId) => {
        try {
            await api.put(`/notifications/${notificationId}/read`)
            setNotifications(notifications.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            ))
            setUnreadCount(Math.max(0, unreadCount - 1))
        } catch (error) {
            console.error('Failed to mark as read:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/mark-all-read')
            setNotifications(notifications.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error('Failed to mark all as read:', error)
        }
    }

    const deleteNotification = async (notificationId) => {
        try {
            await api.delete(`/notifications/${notificationId}`)
            setNotifications(notifications.filter(n => n.id !== notificationId))
            if (!notifications.find(n => n.id === notificationId)?.read) {
                setUnreadCount(Math.max(0, unreadCount - 1))
            }
        } catch (error) {
            console.error('Failed to delete notification:', error)
        }
    }

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id)
        if (notification.action_url) {
            navigate(notification.action_url)
            setShowDropdown(false)
        }
    }

    const getNotificationIcon = (type) => {
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        }
        return icons[type] || '📢'
    }

    const getNotificationColor = (type) => {
        const colors = {
            success: 'from-green-500/20 to-green-500/5 border-green-500/30',
            warning: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30',
            error: 'from-red-500/20 to-red-500/5 border-red-500/30',
            info: 'from-blue-500/20 to-blue-500/5 border-blue-500/30'
        }
        return colors[type] || 'from-gray-500/20 to-gray-500/5 border-gray-500/30'
    }

    return (
        <div className="relative">
            {/* Bell Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                    setShowDropdown(!showDropdown)
                    if (!showDropdown) fetchNotifications()
                }}
                className="relative p-2 rounded-xl bg-white/10 dark:bg-gray-800/50 hover:bg-white/20 dark:hover:bg-gray-700/50 transition-all"
            >
                <motion.div
                    animate={unreadCount > 0 ? { rotate: [0, -15, 15, -15, 0] } : {}}
                    transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3 }}
                >
                    <Bell className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </motion.div>

                {/* Unread Badge */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
                {showDropdown && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDropdown(false)}
                            className="fixed inset-0 z-40"
                        />

                        {/* Dropdown Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-4 bg-gradient-to-r from-bright-teal to-soft-violet text-white flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-lg">Notifications</h3>
                                    <p className="text-sm text-white/80">{unreadCount} unread</p>
                                </div>
                                {unreadCount > 0 && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={markAllAsRead}
                                        className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-all"
                                    >
                                        Mark all read
                                    </motion.button>
                                )}
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-96 overflow-y-auto">
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="w-8 h-8 border-4 border-bright-teal border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Loading...</p>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">No notifications yet</p>
                                        <p className="text-sm text-gray-400 mt-1">We'll notify you when something happens</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {notifications.map((notification) => (
                                            <motion.div
                                                key={notification.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer group relative ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                                                    }`}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                {/* Unread Indicator */}
                                                {!notification.read && (
                                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-bright-teal rounded-full" />
                                                )}

                                                <div className="flex items-start gap-3 pl-4">
                                                    {/* Icon */}
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${getNotificationColor(notification.type)} border flex items-center justify-center text-lg`}>
                                                        {getNotificationIcon(notification.type)}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            {new Date(notification.created_at).toLocaleString()}
                                                        </p>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {!notification.read && (
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    markAsRead(notification.id)
                                                                }}
                                                                className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-all"
                                                                title="Mark as read"
                                                            >
                                                                <Check className="h-4 w-4 text-green-600" />
                                                            </motion.button>
                                                        )}
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                deleteNotification(notification.id)
                                                            }}
                                                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => {
                                            navigate('/notifications')
                                            setShowDropdown(false)
                                        }}
                                        className="w-full text-center text-sm font-semibold text-bright-teal hover:text-soft-violet transition-colors"
                                    >
                                        View All Notifications
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
