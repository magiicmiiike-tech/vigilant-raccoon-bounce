from business.revenue_operations.usage_metering import UsageMetric, PricingPlan, PricingTier, UsageMeter
from decimal import Decimal
from datetime import datetime


def test_calculate_bill_and_predict():
    plan = PricingPlan(plan_id="p1", tier=PricingTier.BUSINESS, base_price=Decimal('99.00'), included_usage={"voice_minutes": Decimal('100')}, overage_rates={"voice_minutes": Decimal('0.01')})
    metric = UsageMetric(metric_name="voice_minutes", value=Decimal('150'), unit="minute", timestamp=datetime.utcnow(), resource_id="r1", tenant_id="t1")
    meter = UsageMeter(redis_url="redis://localhost:6379", db_dsn="postgresql://postgres:postgres@localhost:5432/dukat_voice")

    bill = meter.calculate_bill([metric], plan)
    assert bill == Decimal('99.50')

    preds = meter.predict_overage([metric], plan)
    assert "voice_minutes" in preds
    assert preds["voice_minutes"]["risk"] in ("low", "high")
