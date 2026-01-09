"""
Real-time usage metering and billing:
- Per-second granularity
- Tiered pricing with overages
- Real-time cost calculation
- Predictive billing alerts
- Multi-currency support
"""

import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from decimal import Decimal
import json
from enum import Enum
import redis
import psycopg
try:
    from kafka import KafkaProducer
except Exception:
    KafkaProducer = None
import pandas as pd
import numpy as np

class BillingGranularity(Enum):
    """Billing granularity levels"""
    PER_SECOND = "per_second"
    PER_MINUTE = "per_minute"
    PER_HOUR = "per_hour"
    PER_DAY = "per_day"

class PricingTier(Enum):
    """Pricing tier definitions"""
    STARTER = "starter"
    BUSINESS = "business"
    ENTERPRISE = "enterprise"
    CUSTOM = "custom"

@dataclass
class UsageMetric:
    """Individual usage metric"""
    metric_name: str
    value: Decimal
    unit: str
    timestamp: datetime
    resource_id: str
    tenant_id: str
    tags: Dict[str, str] = field(default_factory=dict)

@dataclass
class PricingPlan:
    """Pricing plan configuration"""
    plan_id: str
    tier: PricingTier
    base_price: Decimal  # Monthly base price
    included_usage: Dict[str, Decimal]  # Included units per metric
    overage_rates: Dict[str, Decimal]  # rate per unit over included usage

class UsageMeter:
    def __init__(self, redis_url: str, db_dsn: str):
        self.redis_conn = redis.Redis.from_url(redis_url)
        self.db_dsn = db_dsn
        self.producer = KafkaProducer() if KafkaProducer else None

    async def record_usage(self, metric: UsageMetric):
        # Store usage point in time-series (Redis or Postgres)
        key = f"usage:{metric.tenant_id}:{metric.metric_name}"
        point = {
            "value": str(metric.value),
            "unit": metric.unit,
            "timestamp": metric.timestamp.isoformat(),
            "resource_id": metric.resource_id
        }
        self.redis_conn.rpush(key, json.dumps(point))
        # Optionally produce to Kafka
        if self.producer:
            self.producer.send('usage-metrics', json.dumps(point).encode())

    def calculate_bill(self, usage_points: List[UsageMetric], plan: PricingPlan) -> Decimal:
        # Aggregate by metric
        totals = {}
        for u in usage_points:
            totals[u.metric_name] = totals.get(u.metric_name, Decimal(0)) + u.value
        total_cost = Decimal(0)
        for metric, amount in totals.items():
            included = plan.included_usage.get(metric, Decimal(0))
            rate = plan.overage_rates.get(metric, Decimal(0))
            if amount <= included:
                cost = Decimal(0)
            else:
                cost = (amount - included) * rate
            total_cost += cost
        total_cost += plan.base_price
        return total_cost

    def predict_overage(self, recent_usage: List[UsageMetric], plan: PricingPlan) -> Dict[str, Any]:
        # Simple heuristic model using linear trend
        preds = {}
        for metric in set(m.metric_name for m in recent_usage):
            series = [m.value for m in recent_usage if m.metric_name == metric]
            if len(series) < 2:
                preds[metric] = {"risk": "low"}
                continue
            slope = (series[-1] - series[0]) / max(1, len(series) - 1)
            projected = series[-1] + slope * 24  # next 24 intervals
            included = plan.included_usage.get(metric, Decimal(0))
            preds[metric] = {"projected": float(projected), "risk": "high" if projected > included else "low"}
        return preds
