import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    const env = loadEnv(mode, process.cwd(), '');
    const enableClerk = env.VITE_ENABLE_CLERK !== 'false';

    return {
        plugins: [react()],
        resolve: {
            alias: {
                ...(enableClerk ? {} : {
                    '@clerk/clerk-react': path.resolve(__dirname, './src/mock-clerk.jsx')
                })
            }
        }
    }
})
