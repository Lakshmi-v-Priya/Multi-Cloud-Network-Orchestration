from app.schemas.optimization import (
    OptimizationCandidate,
    OptimizationResponse,
)

from app.services.cost_service import calculate_cloud_cost


def optimize_intent(intent):
    """
    Rule-based, simulation-only cloud optimization engine.

    Evaluation considers:
    1. Monthly estimated cost
    2. User budget
    3. Cost efficiency relative to other candidates

    CPU, RAM, and storage requirements are passed to the
    existing cost calculation function.
    """

    providers = intent.providers
    candidates = []

    # --------------------------------------------------
    # Calculate estimated costs for all requested providers
    # --------------------------------------------------

    cost_data = []

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
            optimization_strategy="Cost-aware optimization",
            candidates=[],
            recommended_provider=None,
            recommendation_reason="No cloud providers were specified.",
        )

    # --------------------------------------------------
    # Rank providers by estimated cost (lowest first)
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
    # Evaluate budget and calculate optimization score
    # --------------------------------------------------

    for item in cost_data:
        provider = item["provider"]
        monthly_cost = item["cost"]

        within_budget = monthly_cost <= intent.budget

        # Cost efficiency score (maximum 70 points)
        if monthly_cost > 0:
            cost_score = (minimum_cost / monthly_cost) * 70
        else:
            cost_score = 70

        # Budget compliance score (30 points)
        budget_score = 30 if within_budget else 0

        optimization_score = round(
            cost_score + budget_score,
            2,
        )

        reasons = []

        reasons.append(
            f"Estimated monthly cost: "
            f"{intent.currency} {monthly_cost:,.2f}."
        )

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
            f"Allocated {optimization_score}/100 "
            f"based on cost efficiency and budget compliance."
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
                optimization_score=optimization_score,
                recommendation="Pending evaluation",
                reasons=reasons,
            )
        )

    # --------------------------------------------------
    # Select the recommended provider
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
            f"{winner.provider} is selected because it offers "
            f"the best cost-efficiency score among the providers "
            f"that meet the specified budget of "
            f"{intent.currency} {intent.budget:,.2f} per month."
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
            "budget or adjusting the infrastructure requirements."
        )

        for candidate in candidates:
            candidate.recommendation = "Over Budget"

    # --------------------------------------------------
    # Return optimization results
    # --------------------------------------------------

    return OptimizationResponse(
        intent_id=intent.id,
        workload=intent.workload,
        region=intent.region,
        optimization_strategy=(
            "Cost efficiency with budget constraint"
        ),
        candidates=candidates,
        recommended_provider=recommended_provider,
        recommendation_reason=recommendation_reason,
    )