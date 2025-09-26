"use client"

import { useState, useEffect } from "react"

export default function DebugRoutingPage() {
  const [currentPath, setCurrentPath] = useState("")
  const [sessionData, setSessionData] = useState("")

  useEffect(() => {
    setCurrentPath(window.location.pathname)

    try {
      const session = localStorage.getItem("session")
      setSessionData(session || "No session found")
    } catch (error) {
      setSessionData("Error reading session")
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Debug Routing</h1>

        <div className="space-y-4">
          <div>
            <h2 className="font-semibold">Current Path:</h2>
            <p className="text-gray-600">{currentPath}</p>
          </div>

          <div>
            <h2 className="font-semibold">Session Data:</h2>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">{sessionData}</pre>
          </div>

          <div>
            <h2 className="font-semibold">Navigation Links:</h2>
            <div className="space-x-4">
              <a href="/" className="text-blue-600 hover:underline">
                Home
              </a>
              <a href="/login" className="text-blue-600 hover:underline">
                Login
              </a>
              <a href="/test" className="text-blue-600 hover:underline">
                Test
              </a>
              <a href="/setup" className="text-blue-600 hover:underline">
                Setup
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
