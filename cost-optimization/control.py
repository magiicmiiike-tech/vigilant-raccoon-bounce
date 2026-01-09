"""
Cost controls: Semantic caching, budgeting, tiering, caps, kill-switches.
"""
from typing import Dict

class CostController:
    """Controls costs/scaling."""
    def __init__(self):
        self.budgets = {'starter': 1000, 'business': 10000, 'enterprise': 100000}  # Tokens/day
        self.models = {'simple': 'gpt-4o-mini', 'complex': 'gpt-4o'}  # Tiering
        self.tenant_usage = {}  # Per-tenant tracking (in-memory mock)

    async def semantic_cache_check(self, prompt: str) -> str:
        # Real implementation would use GPTCache or similar
        return None # Cache miss

    def budget_tokens(self, tenant_tier: str, tokens_used: int) -> bool:
        limit = self.budgets.get(tenant_tier, 1000)
        current = self.tenant_usage.get(tenant_tier, 0)
        
        if current + tokens_used > limit:
            return False
            
        self.tenant_usage[tenant_tier] = current + tokens_used
        return True

    def select_model(self, complexity: int) -> str:
        return self.models['simple'] if complexity < 50 else self.models['complex']

    def per_tenant_cap(self, tenant_id: str, estimated_cost: float) -> bool:
        if estimated_cost > 100.0:  # Daily $100 cap
            return False
        return True

    def kill_switch(self) -> None:
        print("🚨 KILL-SWITCH ACTIVATED: Disabling agent due to cost overrun")
        # In real scenario, this would set a flag in Redis or DB
