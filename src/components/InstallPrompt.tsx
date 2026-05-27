'use client'

import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if the device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIOSDevice)

    // Check if the app is already installed/running in standalone mode
    const isInstalled = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone
    
    setIsStandalone(isInstalled)
    
    // Only show prompt if it's iOS and not already installed
    if (isIOSDevice && !isInstalled) {
      setShowPrompt(true)
    }
  }, [])

  if (!showPrompt) {
    return null 
  }

  return (
    <div className="fixed bottom-6 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-200 z-50 transition-all duration-300">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900">Install Contractor App</h3>
        <button onClick={() => setShowPrompt(false)} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
      <p className="text-sm text-gray-600">
        For the best experience, install this app on your device. Tap the share button
        <span className="mx-1 inline-block" role="img" aria-label="share icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline -mt-1 text-blue-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15" />
          </svg>
        </span>
        and select <strong className="font-medium text-gray-900">Add to Home Screen</strong>.
      </p>
    </div>
  )
}