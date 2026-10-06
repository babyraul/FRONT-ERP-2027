import React, { useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid'

export default function ThemeToggle() {
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
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            title={theme === 'dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'}
        >
            {theme === 'dark' ? (
                <SunIcon className="w-6 h-6 text-yellow-500" />
            ) : (
                <MoonIcon className="w-6 h-6 text-slate-600" />
            )}
        </button>
    )
}
