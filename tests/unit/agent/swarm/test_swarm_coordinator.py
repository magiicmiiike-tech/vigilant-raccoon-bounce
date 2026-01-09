import pytest
from agent.swarm.swarm_coordinator import (
    SwarmConfiguration,
    AgentSovereigntyLevel,
    MultiAgentSwarm,
)


def test_swarm_coordinator_initializes_agents():
    cfg = SwarmConfiguration(swarm_id="s1", tenant_id="t1", sovereignty_level=AgentSovereigntyLevel.HOSTED)
    swarm = MultiAgentSwarm(cfg)

    # Ensure agent keys exist (placeholders allowed)
    assert "conversation_agent" in swarm.agents
    assert "knowledge_agent" in swarm.agents
    assert "human_proxy" in swarm.agents

    # Ensure configuration applied
    assert swarm.config.max_agents == 10
    assert swarm.encryption_key is not None
