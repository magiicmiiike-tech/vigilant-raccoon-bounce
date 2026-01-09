"use client";

import { useState, useEffect } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  useVoiceAssistant,
  BarVisualizer,
} from "@livekit/components-react";
import "@livekit/components-styles";

export default function CallPage() {
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const startCall = async () => {
    try {
      const resp = await fetch("/api/voice/token", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": "demo-tenant" },
        body: JSON.stringify({
          roomName: "demo-room",
          participantName: "User-" + Math.floor(Math.random() * 1000),
        }),
      });
      const data = await resp.json();
      setToken(data.token);
      setUrl(data.wsUrl);
    } catch (e) {
      console.error(e);
    }
  };

  if (!token || !url) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold mb-8">Dukat Voice AI</h1>
        <button
          onClick={startCall}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-xl font-semibold transition-all shadow-lg"
        >
          Start Conversation
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <LiveKitRoom
        token={token}
        serverUrl={url}
        connect={true}
        onDisconnected={() => {
          setToken(null);
        }}
        className="flex flex-col items-center"
      >
        <div className="mb-12">
          <Visualizer />
        </div>
        
        <VoiceAssistantControlBar />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function Visualizer() {
  const { state, audioTrack } = useVoiceAssistant();
  return (
    <div className="flex flex-col items-center space-y-4">
      <BarVisualizer trackRef={audioTrack} className="h-24 w-64" />
      <p className="text-lg font-medium text-gray-400">
        {state === "speaking" ? "Agent is speaking..." : "Listening..."}
      </p>
    </div>
  );
}
