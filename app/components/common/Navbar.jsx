"use client";

// components/common/Navbar.jsx
import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              {/* <img src="/favicon.ico" alt="Logo" className="h-8 w-8 mr-2" /> */}
              <span className="font-bold text-xl">Biodiversity App</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-blue-600">
              Home
            </Link>
            <Link href="/heatmap" className="text-gray-700 hover:text-blue-600">
              explore maps
            </Link>
            
            {user && (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                  Dashboard
                </Link>
                
                <Link href="/history" className="text-gray-700 hover:text-blue-600">
                  History
                </Link>
                
                {user.is_admin && (
                  <Link href="/admin" className="text-gray-700 hover:text-blue-600">
                    Admin
                  </Link>
                )}
                
                <button 
                  onClick={logout}
                  className="text-red-600 hover:text-red-700"
                >
                  Logout
                </button>
              </>
            )}
            
            {!user && (
              <>
                <Link href="/login" className="text-gray-700 hover:text-blue-600">
                  Login
                </Link>
                <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button className="p-2 text-gray-700 hover:text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden bg-white shadow-md">
        <div className="container mx-auto px-4 py-2">
          {user ? (
            <>
              <Link href="/dashboard" className="block py-2">Dashboard</Link>
              <Link href="/history" className="block py-2">History</Link>
              {user.is_admin && (
                <Link href="/admin" className="block py-2">Admin</Link>
              )}
              <button 
                onClick={logout}
                className="block py-2 text-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="block py-2">Login</Link>
              <Link href="/signup" className="block py-2">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;