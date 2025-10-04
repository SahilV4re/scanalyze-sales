'use client'
import React from 'react'
import Link from 'next/link'
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

function Landing_nav() {
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    useEffect(() => {
        function handleScroll() {
            setScrolled(window.scrollY > 10);
        }
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

        return (
            <div className='w-full'>
                <nav className={`fixed z-50 w-full bg-white p-4 shadow shadow-lg flex items-center justify-between border-b border-gray-400 transition-colors duration-300 ${scrolled ? 'bg-white/50 backdrop-blur-sm shadow-sm' : 'bg-white'}
        `}>
                    {/* Logo */}
                    <div className="flex items-center">
                        <div className="rounded-full bg-green-700 text-white w-8 h-8 flex items-center justify-center font-bold text-lg mr-2">S</div>
                        <span className="font-normal text-xl">Scanalyze</span>
                    </div>
                    {/* Menu */}
                    <div className="items-center hidden md:flex space-x-8 mx-8">
                        <Link href="/"><span className="hover:text-green-600 cursor-pointer">Home</span></Link>
                        <Link href="/login"><span className="hover:text-green-600 cursor-pointer">Dashboard</span></Link>
                        <Link href="/features"><span className="hover:text-green-600 cursor-pointer">Features</span></Link>
                        {pathname === '/' ? (
        // On landing, use anchor for smooth scroll
        <a href="#how-it-works" className="hover:text-green-600 cursor-pointer">
          How it works
        </a>
      ) : (
        // On other pages, route to landing page then scroll
        <Link href="/#how-it-works" className="hover:text-green-600 cursor-pointer">
          How it works
        </Link>
      )}
                        <Link href="/pricing"><span className="hover:text-green-600 cursor-pointer">Pricing</span></Link>
                        <Link href="/testimonials"><span className="hover:text-green-600 cursor-pointer">Testimonials</span></Link>
                    </div>
                    {/* Auth Buttons */}
                    <div className="flex space-x-4">
                        <Link href="/login">
                            <span className="py-2 px-6 font-medium rounded-3xl hover:bg-gray-100 cursor-pointer">Login</span>
                        </Link>
                        <Link href="/login">
                            <span className="py-2 px-6 font-medium rounded-3xl bg-green-700 text-white hover:bg-green-800 transition cursor-pointer">
                                Sign Up Free
                            </span>
                        </Link>
                    </div>
                </nav>
            </div>
        )
    }

export default Landing_nav
