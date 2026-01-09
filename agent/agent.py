import asyncio
import os
import logging
import json
from livekit import rtc, api
from dotenv import load_dotenv
from voice_handler import VoiceHandler

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-agent")

class VoiceAgent:
    def __init__(self):
        self.url = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
        self.api_key = os.getenv("LIVEKIT_API_KEY", "devkey")
        self.api_secret = os.getenv("LIVEKIT_API_SECRET", "devsecret")
        self.room = rtc.Room()
        self.handler = VoiceHandler()

    async def start(self, room_name: str, participant_name: str = "DukatAgent"):
        token = self._generate_token(room_name, participant_name)
        
        @self.room.on("track_subscribed")
        def on_track_subscribed(track: rtc.Track, publication: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
            if track.kind == rtc.TrackKind.KIND_AUDIO:
                logger.info(f"Subscribed to audio track {track.sid} from {participant.identity}")
                asyncio.create_task(self._handle_audio_track(track))

        @self.room.on("disconnected")
        def on_disconnected():
            logger.info("Disconnected from room")

        try:
            logger.info(f"Connecting to room {room_name} at {self.url}...")
            await self.room.connect(self.url, token)
            logger.info(f"Connected to room {self.room.name}")
        except Exception as e:
            logger.error(f"Failed to connect: {e}")

    def _generate_token(self, room_name: str, participant_name: str) -> str:
        grant = api.AccessToken(self.api_key, self.api_secret)
        grant.with_identity(participant_name)
        grant.with_grants(api.VideoGrants(room_join=True, room=room_name))
        return grant.to_jwt()

    async def _handle_audio_track(self, track: rtc.RemoteAudioTrack):
        audio_stream = rtc.AudioStream(track)
        logger.info("Started audio stream processing")
        
        audio_buffer = []
        
        async for frame in audio_stream:
            audio_buffer.append(frame.data)
            
            # Simplified VAD: Process every 100 frames
            if len(audio_buffer) >= 100:
                logger.info("Triggering AI pipeline...")
                combined_audio = b"".join(audio_buffer)
                audio_buffer = []
                
                # Execute pipeline and stream back
                await self._respond_to_user(combined_audio)

    async def _respond_to_user(self, audio_data: bytes):
        """Processes user audio and publishes agent response to the room"""
        try:
            # Create a source and track for the agent's voice
            source = rtc.AudioSource(48000, 1) # 48kHz, mono
            track = rtc.LocalAudioTrack.create_audio_track("agent-voice", source)
            
            # Publish to room
            publication = await self.room.local_participant.publish_track(track)
            logger.info(f"Published agent audio track: {publication.sid}")

            async for audio_chunk in self.handler.run_pipeline(audio_data):
                # Convert chunk to AudioFrame if necessary
                # For this prototype, we'll simulate sending
                # frame = rtc.AudioFrame(audio_chunk, 48000, 1, len(audio_chunk)//2)
                # await source.capture_frame(frame)
                pass
            
            # Unpublish after speaking (optional)
            # await self.room.local_participant.unpublish_track(publication.sid)
            
        except Exception as e:
            logger.error(f"Error in response pipeline: {e}")

    async def wait_until_disconnected(self):
        while self.room.is_connected():
            await asyncio.sleep(1)

async def main():
    agent = VoiceAgent()
    await agent.start("test-room")
    await agent.wait_until_disconnected()

if __name__ == "__main__":
    asyncio.run(main())
