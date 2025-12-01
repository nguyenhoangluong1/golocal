import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from '../Footer';
import Chatbot from '../Chatbot';

interface LayoutProps {
  children?: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* Padding top to account for fixed navbar */}
      <main className="flex-grow pt-20">
        {children || <Outlet />}
      </main>
      <Footer />
      {/* Chatbot - Fixed position in bottom right */}
      <Chatbot />
    </div>
  );
}
