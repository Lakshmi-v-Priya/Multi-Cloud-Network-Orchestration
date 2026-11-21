from app.schemas.comparison import CloudResourceComparison


def compare_cloud_resources(intent):
    """
    Generate representative compute configurations for AWS, Azure, and GCP
    based on the saved intent requirements.

    Pricing is not integrated yet.
    """

    cpu = intent.cpu
    ram = intent.ram

    comparison_results = []

    providers = [
        {
            "provider": "AWS",
            "instance_type": f"EC2 candidate ({cpu} vCPU, {ram} GB RAM)",
            "storage_type": "EBS SSD",
            "notes": "Representative AWS configuration. Exact instance selection and pricing integration pending.",
        },
        {
            "provider": "Azure",
            "instance_type": f"Azure VM candidate ({cpu} vCPU, {ram} GB RAM)",
            "storage_type": "Azure Managed SSD",
            "notes": "Representative Azure configuration. Exact VM size selection and pricing integration pending.",
        },
        {
            "provider": "GCP",
            "instance_type": f"Compute Engine candidate ({cpu} vCPU, {ram} GB RAM)",
            "storage_type": "Persistent SSD",
            "notes": "Representative GCP configuration. Exact machine type selection and pricing integration pending.",
        },
    ]

    for cloud in providers:
        result = CloudResourceComparison(
            provider=cloud["provider"],
            instance_type=cloud["instance_type"],
            vcpu=cpu,
            ram_gb=ram,
            estimated_monthly_cost=None,
            currency=intent.currency,
            storage_type=cloud["storage_type"],
            notes=cloud["notes"],
        )

        comparison_results.append(result)

    return comparison_results