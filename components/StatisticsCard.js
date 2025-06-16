'use client';

import { motion } from 'framer-motion';

export default function StatisticsCard({
    title,
    value,
    icon,
    gradient,
    subtitle,
    description,
    trend,
    index = 0
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="bg-white shadow-sm p-5 rounded-2xl hover:shadow-lg transition-all duration-300"
        >
            <div className="flex justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <span className="text-gray-600/80 font-bold leading-tight text-sm">
                        {title}
                    </span>
                    <div className="text-gray-900 font-semibold text-2xl leading-tight">
                        {value}
                    </div>
                </div>
                <div className={`flex items-center justify-center ${gradient} rounded-lg w-10 h-10 shadow-sm`}>
                    <div className="text-white text-xl">
                        {icon}
                    </div>
                </div>
            </div>

            {(subtitle || description || trend) && (
                <div className="mt-4">
                    {subtitle && (
                        <span className="text-gray-700 font-medium leading-tight">
                            {subtitle}
                        </span>
                    )}
                    {description && (
                        <span className="text-gray-900/40 leading-tight ml-1">
                            {description}
                        </span>
                    )}
                    {trend && (
                        <div className="flex items-center mt-2">
                            <span className={`text-sm font-medium ${trend.type === 'positive' ? 'text-green-600' :
                                trend.type === 'negative' ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                {trend.value}
                            </span>
                            <span className="text-gray-500 font-semibold text-sm ml-1">{trend.label}</span>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}