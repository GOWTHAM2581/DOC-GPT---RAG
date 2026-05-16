import React from 'react';

/**
 * Mock Clerk implementation to allow running the app without authentication.
 */

export const ClerkProvider = ({ children }) => <>{children}</>;

export const SignedIn = ({ children }) => <>{children}</>;

export const SignedOut = ({ children }) => null;

export const UserButton = () => (
    <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-400 text-xs font-bold" title="Guest Mode">
        G
    </div>
);

export const SignInButton = ({ children }) => <>{children}</>;

export const SignUpButton = ({ children }) => <>{children}</>;

export const useAuth = () => ({
    isSignedIn: true,
    isLoaded: true,
    userId: 'mock_user_123',
    getToken: async () => 'mock_token_abc',
});

export const useUser = () => ({
    user: {
        id: 'mock_user_123',
        fullName: 'Guest User',
        firstName: 'Guest',
        lastName: 'User',
        primaryEmailAddress: { emailAddress: 'guest@example.com' },
        imageUrl: '',
    },
    isLoaded: true,
    isSignedIn: true,
});

export const useClerk = () => ({
    signOut: () => {
        console.log("Mock Sign Out - Redirecting to home");
        window.location.href = "/";
    },
});

export default {
    ClerkProvider,
    SignedIn,
    SignedOut,
    UserButton,
    SignInButton,
    SignUpButton,
    useAuth,
    useUser,
    useClerk
};
