import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const ENABLE_CLERK = import.meta.env.VITE_ENABLE_CLERK !== 'false';

if (ENABLE_CLERK && !PUBLISHABLE_KEY) {
    throw new Error("Missing Publishable Key")
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
            <App />
        </ClerkProvider>
    </StrictMode>,
)
