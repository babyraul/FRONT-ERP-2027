import React, { useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid'

export default function ThemeToggle({ className = '' }) {
    const { theme, toggle, initTheme } = useTheme()

    // Sincronizar el tema al cargar el componente principal si es necesario
    // Aunque usualmente se llama initTheme() desde App.jsx, también es seguro aquí.
    useEffect(() => {
        initTheme()
    }, [initTheme])

    return (
        <button
            aria-label="Toggle theme"
            onClick={toggle}
            className={`p-2 rounded-full transition-colors ${className || 'hover:bg-gray-200 dark:hover:bg-slate-700'}`}
            title={theme === 'dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'}
        >
            {theme === 'dark' ? (
                <SunIcon className="w-5 h-5 text-amber-300" />
            ) : (
                <MoonIcon className={`w-5 h-5 ${className ? 'text-white' : 'text-slate-600'}`} />
            )}
        </button>
    )
}
