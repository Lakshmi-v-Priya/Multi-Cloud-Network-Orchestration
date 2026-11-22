from app.schemas.optimization import (
    OptimizationCandidate,
    OptimizationResponse,
)

from app.services.cost_service import calculate_cloud_cost


# --------------------------------------------------
# Simulated suitability profiles
# These are illustrative model values, NOT measured data.
# Replace them later with validated provider/region data.
# --------------------------------------------------

LATENCY_PROFILES = {
    "AWS": {
        "Very Low": 20,
        "Low": 16,
        "Medium": 12,
        "Flexible": 10,
    },
    "Azure": {
        "Very Low": 18,
        "Low": 17,
        "Medium": 13,
        "Flexible": 10,
    },
    "GCP": {
        "Very Low": 19,
        "Low": 16,
        "Medium": 14,
        "Flexible": 10,
    },
}

AVAILABILITY_PROFILES = {
    "AWS": {
        "Basic": 12,
        "High": 16,
        "Very High": 18,
        "Mission Critical": 19,
    },
    "Azure": {
        "Basic": 12,
        "High": 17,
        "Very High": 18,
        "Mission Critical": 20,
    },
    "GCP": {
        "Basic": 12,
        "High": 16,
        "Very High": 19,
        "Mission Critical": 19,
    },
}


def optimize_intent(intent):
    """
    Multi-objective, rule-based cloud optimization engine.

    Weighted objectives:
    - Cost efficiency: 35 points
    - Budget compliance: 25 points
    - Latency suitability: 20 points
    - Availability suitability: 20 points

    Total: 100 points

    Latency and availability scores use illustrative simulation
    profiles. They are not live cloud measurements.
    """

    providers = intent.providers
    candidates = []
    cost_data = []

    # --------------------------------------------------
    # Calculate estimated costs for all providers
    # --------------------------------------------------

    for provider in providers:
        estimate = calculate_cloud_cost(
            provider=provider,
            cpu=intent.cpu,
            ram=intent.ram,
            storage=intent.storage,
            currency=intent.currency,
        )

        cost_data.append({
            "provider": provider,
            "instance_type": estimate.instance_type,
            "cost": estimate.total_monthly_cost,
        })

    if not cost_data:
        return OptimizationResponse(
            intent_id=intent.id,
            workload=intent.workload,
            region=intent.region,
            optimization_strategy="Multi-objective optimization",
            candidates=[],
            recommended_provider=None,
            recommendation_reason="No cloud providers were specified.",
        )

    # --------------------------------------------------
    # Rank providers by estimated monthly cost
    # --------------------------------------------------

    ranked_costs = sorted(
        cost_data,
        key=lambda item: item["cost"],
    )

    cost_ranks = {
        item["provider"]: rank
        for rank, item in enumerate(ranked_costs, start=1)
    }

    minimum_cost = ranked_costs[0]["cost"]

    # --------------------------------------------------
    # Evaluate the four optimization objectives
    # --------------------------------------------------

    for item in cost_data:
        provider = item["provider"]
        monthly_cost = item["cost"]

        within_budget = monthly_cost <= intent.budget

        # 1. Cost efficiency: maximum 35 points
        if monthly_cost > 0:
            cost_score = (minimum_cost / monthly_cost) * 35
        else:
            cost_score = 35

        cost_score = round(cost_score, 2)

        # 2. Budget compliance: maximum 25 points
        budget_score = 25 if within_budget else 0

        # 3. Latency suitability: maximum 20 points
        latency_score = LATENCY_PROFILES.get(
            provider, {}
        ).get(intent.latency, 10)

        # 4. Availability suitability: maximum 20 points
        availability_score = AVAILABILITY_PROFILES.get(
            provider, {}
        ).get(intent.availability, 12)

        # Combined score out of 100
        optimization_score = round(
            cost_score
            + budget_score
            + latency_score
            + availability_score,
            2,
        )

        # --------------------------------------------------
        # Explain the score to the user
        # --------------------------------------------------

        reasons = [
            f"Estimated monthly cost: "
            f"{intent.currency} {monthly_cost:,.2f}.",
            f"Cost efficiency score: {cost_score}/35.",
            f"Budget compliance score: {budget_score}/25.",
            f"Latency suitability score: {latency_score}/20 "
            f"for the '{intent.latency}' requirement.",
            f"Availability suitability score: "
            f"{availability_score}/20 for the "
            f"'{intent.availability}' requirement.",
        ]

        if within_budget:
            remaining_budget = intent.budget - monthly_cost
            reasons.append(
                f"Within budget, leaving "
                f"{intent.currency} {remaining_budget:,.2f}."
            )
        else:
            excess = monthly_cost - intent.budget
            reasons.append(
                f"Exceeds budget by "
                f"{intent.currency} {excess:,.2f}."
            )

        if monthly_cost == minimum_cost:
            reasons.append(
                "Lowest estimated cost among evaluated providers."
            )

        reasons.append(
            f"Total weighted score: "
            f"{optimization_score}/100."
        )

        reasons.append(
            "Latency and availability are based on illustrative "
            "simulation profiles, not live measurements."
        )

        candidates.append(
            OptimizationCandidate(
                provider=provider,
                instance_type=item["instance_type"],
                estimated_monthly_cost=monthly_cost,
                budget=intent.budget,
                currency=intent.currency,
                within_budget=within_budget,
                cost_rank=cost_ranks[provider],
                cost_score=cost_score,
                budget_score=budget_score,
                latency_score=latency_score,
                availability_score=availability_score,
                optimization_score=optimization_score,
                recommendation="Pending evaluation",
                reasons=reasons,
            )
        )

    # --------------------------------------------------
    # Select the best provider within the budget
    # --------------------------------------------------

    eligible_candidates = [
        candidate
        for candidate in candidates
        if candidate.within_budget
    ]

    eligible_candidates.sort(
        key=lambda candidate: (
            -candidate.optimization_score,
            candidate.estimated_monthly_cost,
        )
    )

    recommended_provider = None
    recommendation_reason = None

    if eligible_candidates:
        winner = eligible_candidates[0]
        recommended_provider = winner.provider

        recommendation_reason = (
            f"{winner.provider} is recommended with a weighted "
            f"score of {winner.optimization_score}/100. It meets "
            f"the monthly budget of {intent.currency} "
            f"{intent.budget:,.2f} and ranks highest among "
            f"budget-compliant candidates using the simulated "
            f"cost, latency and availability scoring model."
        )

        for candidate in candidates:
            if candidate.provider == recommended_provider:
                candidate.recommendation = "Recommended"
            elif candidate.within_budget:
                candidate.recommendation = "Alternative"
            else:
                candidate.recommendation = "Over Budget"

    else:
        recommendation_reason = (
            "None of the evaluated cloud providers meet the "
            "specified monthly budget. Consider increasing the "
            "budget or adjusting infrastructure requirements."
        )

        for candidate in candidates:
            candidate.recommendation = "Over Budget"

    # --------------------------------------------------
    # Return results
    # --------------------------------------------------

    return OptimizationResponse(
        intent_id=intent.id,
        workload=intent.workload,
        region=intent.region,
        optimization_strategy=(
            "Weighted multi-objective optimization: "
            "cost (35%), budget (25%), latency (20%), "
            "availability (20%)"
        ),
        candidates=candidates,
        recommended_provider=recommended_provider,
        recommendation_reason=recommendation_reason,
    )