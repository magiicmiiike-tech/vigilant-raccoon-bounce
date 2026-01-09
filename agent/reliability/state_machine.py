"""
Deterministic state machines for agents: Reliable, replayable.
"""
from enum import Enum
from typing import Dict, List, Any
import time

class AgentState(Enum):
    IDLE = 0
    LISTENING = 1
    PROCESSING = 2
    RESPONDING = 3
    ESCALATING = 4

class AgentStateMachine:
    """Deterministic FSM for agent reliability."""
    def __init__(self):
        self.state = AgentState.IDLE
        self.history = []  # For replay
        self.memory = {}  # With decay

    def transition(self, event: str) -> AgentState:
        transitions = {
            AgentState.IDLE: {'start_call': AgentState.LISTENING},
            AgentState.LISTENING: {'speech_detected': AgentState.PROCESSING},
            AgentState.PROCESSING: {'response_ready': AgentState.RESPONDING, 'error': AgentState.ESCALATING},
            AgentState.RESPONDING: {'done': AgentState.LISTENING}, # Loop back to listen
            AgentState.ESCALATING: {'handled': AgentState.IDLE},
        }
        
        next_state = transitions.get(self.state, {}).get(event)
        if next_state:
            self.state = next_state
            self.history.append((event, next_state))
            return next_state
        
        print(f"⚠️ Invalid transition: {self.state} with event {event}")
        return self.state

    def decay_memory(self, ttl: int = 3600):
        """Memory decay: Remove old entries."""
        now = time.time()
        self.memory = {k: v for k, v in self.memory.items() if v.get('timestamp', 0) > now - ttl}

    def replay_conversation(self, history: List) -> bool:
        """Replay for audits: Deterministic check."""
        temp_machine = AgentStateMachine()
        for event, expected in history:
            if temp_machine.transition(event) != expected:
                return False
        return True
