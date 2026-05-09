import React from 'react'

export default function Landing(){
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-[300px] h-[300px] rounded-md bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mb-6 shadow-lg">
        <div className="text-4xl font-bold">CI</div>
      </div>
      <h2 className="text-2xl font-bold mb-2">Welcome to Imagyn Studio</h2>
      <p className="opacity-80">Professional AI Image Generation — enter a prompt and click Generate.</p>
    </div>
  )
}
