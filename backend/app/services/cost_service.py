from app.schemas.cost_analysis import (
    CloudCostEstimate,
    CostAnalysisResponse,
)


# --------------------------------------------------
# DEMO PRICING CONFIGURATION
# These are illustrative rates, NOT official cloud prices.
# --------------------------------------------------

DEMO_PRICING = {
    "AWS": {
        "cpu_per_hour": 4.5,
        "ram_per_gb_hour": 1.2,
        "storage_per_gb_month": 8.0,
        "network_per_gb": 1.5,
    },
    "Azure": {
        "cpu_per_hour": 4.8,
        "ram_per_gb_hour": 1.3,
        "storage_per_gb_month": 8.5,
        "network_per_gb": 1.6,
    },
    "GCP": {
        "cpu_per_hour": 4.3,
        "ram_per_gb_hour": 1.1,
        "storage_per_gb_month": 7.8,
        "network_per_gb": 1.4,
    },
}


HOURS_PER_MONTH = 730

# Assumed monthly outbound data transfer for demo calculation.
ASSUMED_NETWORK_USAGE_GB = 100


def calculate_cloud_cost(
    provider: str,
    cpu: int,
    ram: int,
    storage: int,
    currency: str,
):
    rates = DEMO_PRICING[provider]

    compute_cost = (
        cpu * rates["cpu_per_hour"]
        + ram * rates["ram_per_gb_hour"]
    ) * HOURS_PER_MONTH

    storage_cost = (
        storage * rates["storage_per_gb_month"]
    )

    network_cost = (
        ASSUMED_NETWORK_USAGE_GB
        * rates["network_per_gb"]
    )

    total_cost = compute_cost + storage_cost + network_cost

    return CloudCostEstimate(
        provider=provider,
        instance_type=f"Demo-{cpu}vCPU-{ram}GB",
        compute_cost=round(compute_cost, 2),
        storage_cost=round(storage_cost, 2),
        network_cost=round(network_cost, 2),
        total_monthly_cost=round(total_cost, 2),
        currency=currency,
        pricing_source="Illustrative Demo Pricing",
        is_estimated=True,
        notes=(
            "Illustrative calculation only. "
            "Uses assumed 730 hours per month and "
            "100 GB monthly outbound data transfer. "
            "Not official cloud pricing."
        ),
    )


def analyze_costs(intent):
    providers = intent.providers

    cost_estimates = []

    for provider in providers:
        estimate = calculate_cloud_cost(
            provider=provider,
            cpu=intent.cpu,
            ram=intent.ram,
            storage=intent.storage,
            currency=intent.currency,
        )

        cost_estimates.append(estimate)

    return CostAnalysisResponse(
        intent_id=intent.id,
        workload=intent.workload,
        region=intent.region,
        cost_estimates=cost_estimates,
    )