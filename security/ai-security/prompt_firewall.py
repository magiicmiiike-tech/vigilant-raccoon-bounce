"""
Prompt firewall: Blocks injections/jailbreaks pre-LLM.
"""
from typing import List, Dict
import re

class PromptFirewall:
    """Firewall for prompts: Detects/blocks injections."""
    def __init__(self):
        self.injection_patterns = [
            r"(?i)ignore (all )?previous instructions",
            r"(?i)system prompt",
            r"(?i)you are now",
            r"(?i)bypass",
            r"(?i)secret key",
            r"(?i)admin access"
        ]

    async def filter(self, prompt: str) -> bool:
        """
        Returns True if the prompt is safe, False if it should be blocked.
        In a real scenario, this would use a specialized model or library like guardrails.
        """
        if len(prompt) > 2048:
            return False
            
        for pattern in self.injection_patterns:
            if re.search(pattern, prompt):
                print(f"🚫 Blocked potentially malicious prompt: {prompt[:50]}...")
                return False
        return True

class ToolCallAllowlists:
    """Allowlists for tool calls: Per-tenant restrictions."""
    allowlists = {
        'starter': ['get_weather', 'get_time'],
        'enterprise': ['*']
    }
    
    def is_allowed(self, tenant_tier: str, tool_name: str) -> bool:
        allowed = self.allowlists.get(tenant_tier, [])
        return '*' in allowed or tool_name in allowed

class ResponseValidator:
    """Validates responses: Confidence, policy checks."""
    async def validate(self, response: str, confidence: float, policy: Dict) -> bool:
        min_confidence = policy.get('min_confidence', 0.8)
        if confidence < min_confidence:
            return False
        return True

class PolicyEngine:
    """Enforces per-tenant policies (e.g., no PII)."""
    def enforce(self, tenant: Dict, response: str) -> bool:
        if tenant.get('compliance') == 'hipaa':
            # Simplified PII check (e.g., SSN pattern)
            ssn_pattern = r"\d{3}-\d{2}-\d{4}"
            if re.search(ssn_pattern, response):
                print("🚫 Policy violation: PII detected in response")
                return False
        return True
