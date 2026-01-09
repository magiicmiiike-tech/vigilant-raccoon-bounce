import pytest
import importlib.util
import asyncio
from pathlib import Path

# Load module by path (package dir contains a hyphen; import by path avoids issues in test env)
MODULE_PATH = Path(__file__).resolve().parents[3] / "telephony" / "emergency-services" / "ng911_handler.py"
spec = importlib.util.spec_from_file_location("ng911_handler", MODULE_PATH)
ng911 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ng911)  # type: ignore
NG911Handler = ng911.NG911Handler
NG911Config = ng911.NG911Config


@pytest.mark.asyncio
async def test_handle_emergency_call_basic():
    handler = NG911Handler(NG911Config(test_mode=True))
    call_data = {
        "dialed_number": "911",
        "call_id": "call-123",
        "caller_number": "+15550001111",
        "gps_coordinates": (40.7128, -74.0060),
    }

    result = await handler.handle_emergency_call(call_data)
    assert result["success"] is True
    assert "psap" in result
    assert result["location"]["accuracy_meters"] <= 50 or result["location"]["accuracy_meters"] == 10
    assert result["callback_number"] == call_data["caller_number"]
