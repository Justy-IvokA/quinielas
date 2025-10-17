"use client";

/**
 * DEBUG COMPONENT - Remove after testing
 * 
 * This component helps debug environment variable issues
 * Add it temporarily to your page to see what's available
 */
export function DebugEnv() {
  if (process.env.NODE_ENV === "production") {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg border border-yellow-500 max-w-md z-50">
      <h3 className="font-bold text-yellow-400 mb-2">🔍 Debug: Environment Variables</h3>
      <div className="space-y-1 text-xs font-mono">
        <div>
          <span className="text-gray-400">NEXT_PUBLIC_SPORTS_API_KEY:</span>{" "}
          <span className={process.env.NEXT_PUBLIC_SPORTS_API_KEY ? "text-green-400" : "text-red-400"}>
            {process.env.NEXT_PUBLIC_SPORTS_API_KEY ? "✓ Set" : "✗ Not set"}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Value (first 10 chars):</span>{" "}
          <span className="text-blue-400">
            {process.env.NEXT_PUBLIC_SPORTS_API_KEY?.substring(0, 10) || "N/A"}...
          </span>
        </div>
        <div>
          <span className="text-gray-400">NODE_ENV:</span>{" "}
          <span className="text-purple-400">{process.env.NODE_ENV}</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
        💡 If "Not set", check:
        <ol className="list-decimal list-inside mt-1 space-y-1">
          <li>Variable name has NEXT_PUBLIC_ prefix</li>
          <li>Server was restarted after adding .env.local</li>
          <li>No typos in .env.local file</li>
        </ol>
      </div>
    </div>
  );
}
