"use client";

import Link from "next/link";
import {
  IconCloud,
  IconMail,
  IconBrandGithub,
  IconBrandTwitter,
  IconMapPin,
  IconShield,
  IconFileText,
  IconHeart,
  IconBrandInstagram,
} from "@tabler/icons-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-lg">
                <IconCloud className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Aeros</h3>
                <p className="text-sm text-slate-400">Air Quality Monitor</p>
              </div>
            </div>
            <p className="text-base text-slate-300 leading-relaxed max-w-md">
              Monitor environmental conditions and get real-time air quality
              insights for better health decisions across the United States.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 max-w-sm">
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-white">50+</div>
                <div className="text-xs text-slate-400">States Covered</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-white">24/7</div>
                <div className="text-xs text-slate-400">Real-time Data</div>
              </div>
            </div>
          </div>

          {/* Contact & Links Section */}
          <div className="space-y-8">
            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h5 className="text-sm font-semibold text-white uppercase tracking-wide">
                  Product
                </h5>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/home"
                      className="text-sm text-slate-400 hover:text-white transition-colors duration-200 flex items-center gap-2"
                    >
                      <IconMapPin className="w-3 h-3" />
                      Air Quality Map
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/profile"
                      className="text-sm text-slate-400 hover:text-white transition-colors duration-200"
                    >
                      Your Profile
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h5 className="text-sm font-semibold text-white uppercase tracking-wide">
                  Follow Us
                </h5>
                <div className="flex items-center gap-3">
                  <a
                    href="https://github.com/Benjamngarcia/space-apps-frontend"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-purple-600 transition-all duration-200 transform hover:scale-105"
                    aria-label="GitHub"
                  >
                    <IconBrandGithub className="w-5 h-5" />
                  </a>
                  <a
                    href="https://instagram.com/dictamigos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-purple-600 transition-all duration-200 transform hover:scale-105"
                    aria-label="Twitter"
                  >
                    <IconBrandInstagram className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>© 2025 Aeros. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Made with</span>
              <IconHeart className="w-4 h-4 text-red-500 animate-pulse" />
              <span>for Dictamigos</span>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              Air quality data is provided for informational purposes only.
              Always consult official environmental agencies for critical
              decisions. Data sources include EPA and other certified monitoring
              stations.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
