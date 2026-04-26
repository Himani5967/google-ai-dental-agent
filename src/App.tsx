/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import VoiceAgent from "./components/VoiceAgent";
import { Sparkles, Calendar, Clock, MapPin, Phone } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-teal-100 italic-none">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">
              Ziva’s <span className="text-teal-600">Dental Care</span>
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-teal-600 transition-colors">Services</a>
            <a href="#" className="hover:text-teal-600 transition-colors">About</a>
            <a href="#" className="text-teal-600 underline underline-offset-8">Book Appointment</a>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column: Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>Next-Gen Dentistry</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                A smile as unique <br />
                <span className="text-teal-600 italic">as you are.</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                Welcome to Ziva's Dental Care. Our super-human AI receptionist is ready 
                to help you find the perfect time for your next visit. No hold times, 
                just natural conversation.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="text-teal-600 w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Easy Booking</h3>
                  <p className="text-sm text-slate-500">Voice-powered appointment scheduling.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="text-teal-600 w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">No Waiting</h3>
                  <p className="text-sm text-slate-500">Talk to our assistant instantly.</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-200 flex items-center space-x-8">
              <div className="flex items-center space-x-2 text-slate-500 text-sm">
                <MapPin className="w-4 h-4" />
                <span>123 Dental St, Wellness City</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-500 text-sm">
                <Phone className="w-4 h-4" />
                <span>+1 (555) ZIVA-CARE</span>
              </div>
            </div>
          </div>

          {/* Right Column: Voice Agent */}
          <div className="flex justify-center xl:justify-end">
            <div className="relative w-full max-w-md">
              {/* Background Decoration */}
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-teal-200/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl" />
              
              <VoiceAgent />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 px-6 text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <Sparkles className="text-teal-500 w-5 h-5" />
            <span className="font-bold text-white tracking-tight">
              Ziva’s Dental Care
            </span>
          </div>
          <p className="text-sm">© 2026 Ziva’s Dental Care. Powered by Gemini Live AI.</p>
          <div className="flex space-x-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

