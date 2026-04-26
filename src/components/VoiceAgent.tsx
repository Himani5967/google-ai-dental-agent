/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Phone, Volume2, Loader2, CheckCircle2, X } from "lucide-react";
import { AudioService } from "../services/audioService";
import { GeminiLiveService, AppointmentData } from "../services/geminiLiveService";

export default function VoiceAgent() {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [bookingData, setBookingData] = useState<AppointmentData | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<AppointmentData | null>(null);
  const [isBooked, setIsBooked] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  
  const audioService = useRef<AudioService | null>(null);
  const geminiService = useRef<GeminiLiveService | null>(null);

  useEffect(() => {
    audioService.current = new AudioService();
    geminiService.current = new GeminiLiveService();

    return () => {
      stopSession();
    };
  }, []);

  const startSession = async () => {
    setIsConnecting(true);
    setIsBooked(false);
    setIsBooking(false);
    setBookingData(null);
    setConfirmedBooking(null);
    try {
      await geminiService.current?.connect({
        onOpen: () => {
          setIsConnecting(false);
          setIsActive(true);
          setIsListening(true);
          audioService.current?.startStreaming((base64Data) => {
            geminiService.current?.sendAudio(base64Data);
          });
        },
        onAudioOutput: (base64Data) => {
          audioService.current?.playAudioChunk(base64Data);
        },
        onInterrupted: () => {
          audioService.current?.clearQueue();
        },
        onShowForm: (data) => {
          setBookingData(data);
        },
        onClose: () => {
          stopSession();
        },
      });
    } catch (error) {
      console.error("Failed to connect:", error);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    audioService.current?.stopStreaming();
    geminiService.current?.disconnect();
    setIsActive(false);
    setIsConnecting(false);
    setIsListening(false);
  };

  const handleBookConfirmation = async () => {
    if (!bookingData) return;
    setIsBooking(true);
    try {
      const response = await fetch("/api/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        setConfirmedBooking(bookingData);
        setIsBooked(true);
        setBookingData(null);
        stopSession();
      } else {
        const err = await response.json();
        const errorMsg = err.suggestion 
          ? `${err.error}\n\nTip: ${err.suggestion}`
          : (err.error || "Unknown error");
        alert("Booking Error:\n" + errorMsg);
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("An error occurred while finalizing your booking.");
    } finally {
      setIsBooking(false);
    }
  };

  const toggleSession = () => {
    if (isActive || isConnecting) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex flex-col items-center justify-center space-y-8 p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl">
        <div className="relative">
          <motion.div
            animate={isActive ? { scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`absolute inset-0 rounded-full bg-teal-400/20 blur-xl ${isActive ? 'block' : 'hidden'}`}
          />
          
          <button
            onClick={toggleSession}
            disabled={isConnecting}
            className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg ${
              isActive 
                ? "bg-red-500 hover:bg-red-600 shadow-red-500/40" 
                : "bg-teal-600 hover:bg-teal-700 shadow-teal-600/40"
            } ${isConnecting ? "opacity-75 cursor-wait" : "cursor-pointer"}`}
            id="talk-button"
          >
            {isConnecting ? (
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            ) : isActive ? (
              <MicOff className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </button>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-gray-800">
            {isActive ? "Connected with AI Agent" : isBooked ? "Booking Confirmed!" : "Need an Appointment?"}
          </h2>
          <p className="text-gray-500 max-w-xs">
            {isActive 
              ? "Go ahead, tell him what's happening or just say hi!" 
              : isBooked 
                ? "Your appointment has been successfully scheduled. We'll see you soon!"
                : "Simply tap the button to talk with our real-time assistant."}
          </p>
        </div>

        <AnimatePresence>
          {isBooked && confirmedBooking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full bg-white rounded-2xl p-6 shadow-xl border border-teal-100"
            >
              <div className="flex items-center space-x-3 text-teal-600 mb-4 pb-4 border-b border-teal-50">
                <CheckCircle2 className="w-8 h-8" />
                <div>
                  <h3 className="font-bold text-lg leading-none">Booking Confirmed</h3>
                  <p className="text-sm text-teal-600/70">Check your email for details</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Patient</span>
                  <span className="text-slate-700 font-semibold">{confirmedBooking.patientName}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Appt Time</span>
                  <span className="text-slate-700 font-semibold">{confirmedBooking.preferredTime}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Appt Date</span>
                  <span className="text-slate-700 font-semibold">{confirmedBooking.preferredDate}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Reason</span>
                  <span className="text-slate-700 font-semibold italic">{confirmedBooking.issue}</span>
                </div>
              </div>

              <button 
                onClick={() => { setIsBooked(false); setConfirmedBooking(null); }}
                className="w-full mt-6 py-2 bg-slate-50 text-slate-500 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-colors border border-slate-100"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center space-x-2 text-teal-600 bg-teal-50 px-4 py-2 rounded-full font-medium text-sm"
            >
              <div className="flex space-x-1">
                  {[1, 2, 3].map((i) => (
                      <motion.div
                          key={i}
                          animate={{ height: [4, 12, 4] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                          className="w-1 bg-teal-600 rounded-full"
                      />
                  ))}
              </div>
              <span>Live Voice Session</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section removed and handled above in AnimatePresence */}
      </div>

      {/* Booking Form Overlay */}
      <AnimatePresence>
        {bookingData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mt-6 p-6 bg-white rounded-3xl shadow-xl border border-slate-200"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Confirm Booking</h3>
              <button 
                onClick={() => setBookingData(null)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleBookConfirmation(); }}>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Name</label>
                <input 
                  type="text" 
                  value={bookingData.patientName} 
                  onChange={(e) => setBookingData({...bookingData, patientName: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reason for Visit</label>
                <input 
                  type="text" 
                  value={bookingData.issue} 
                  onChange={(e) => setBookingData({...bookingData, issue: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</label>
                  <input 
                    type="text" 
                    value={bookingData.preferredDate} 
                    onChange={(e) => setBookingData({...bookingData, preferredDate: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Time</label>
                  <input 
                    type="text" 
                    value={bookingData.preferredTime} 
                    onChange={(e) => setBookingData({...bookingData, preferredTime: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={bookingData.email} 
                  onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isBooking}
                className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/30 flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-wait"
              >
                {isBooking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <span>Finalize Booking</span>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
