import React from 'react';
import Sidebar from '../components/Sidebar';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
    return (
        <div className="flex min-h-screen bg-[#0f1115]">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen bg-[#0f1115] text-white">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
