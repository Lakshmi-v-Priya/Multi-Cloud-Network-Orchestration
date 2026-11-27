
from typing import Any
import ipaddress

from app.schemas.network_topology import (
    SubnetPlan,
    NetworkComponent,
)


# ============================================================
# 1. WORKLOAD CLASSIFICATION
# ============================================================

def classify_workload(intent: Any) -> str:
    """
    Classify the workload using its primary workload name,
    description, availability requirement, and user count.
    """

    workload_name = str(intent.workload).lower()
    description = str(intent.description).lower()
    workload_text = f"{workload_name} {description}"

    web_keywords = [
        "web application",
        "web app",
        "website",
        "frontend",
        "portal",
        "e-commerce",
        "ecommerce",
        "web",
    ]

    api_keywords = [
        "api",
        "backend service",
        "microservice",
        "microservices",
    ]

    database_keywords = [
        "database",
        "db",
        "sql",
        "postgres",
        "mysql",
        "mongodb",
        "data warehouse",
    ]

    # 1. Web workloads take priority over database mentions.
    if any(keyword in workload_text for keyword in web_keywords):
        return "Three-Tier Web Architecture"

    # 2. API and microservice workloads.
    if any(keyword in workload_text for keyword in api_keywords):
        return "API / Service Architecture"

    # 3. Database-focused workloads.
    if any(keyword in workload_name for keyword in database_keywords):
        return "Database-Centric Architecture"

    if any(keyword in description for keyword in database_keywords):
        return "Database-Centric Architecture"

    # 4. High availability workloads.
    if intent.availability in ["Very High", "Mission Critical"]:
        return "High-Availability Architecture"

    # 5. Large workloads.
    if intent.users >= 10000:
        return "Scalable Multi-Tier Architecture"

    # 6. Default architecture.
    return "Basic Network Architecture"


# ============================================================
# 2. SUBNET PLANNING
# ============================================================

def plan_subnets(
    architecture_type: str,
    availability: str,
) -> list[SubnetPlan]:
    """
    Allocate simulated, non-overlapping subnet CIDRs
    based on architecture type and availability.
    """

    network = ipaddress.ip_network("10.0.0.0/16")

    architecture_tiers = {
        "Three-Tier Web Architecture": [
            ("Public", "Public", "Internet-facing entry layer"),
            ("Application", "Private", "Hosts application services"),
            ("Database", "Private", "Hosts database services"),
        ],

        "Database-Centric Architecture": [
            ("Application", "Private", "Database application access layer"),
            ("Database", "Private", "Isolated database layer"),
        ],

        "API / Service Architecture": [
            ("Public", "Public", "API entry layer"),
            ("Application", "Private", "Backend API services"),
        ],

        "High-Availability Architecture": [
            ("Public", "Public", "Public traffic entry layer"),
            ("Application", "Private", "Application services"),
            ("Database", "Private", "Database services"),
        ],

        "Scalable Multi-Tier Architecture": [
            ("Public", "Public", "Public entry layer"),
            ("Application", "Private", "Scalable application layer"),
            ("Database", "Private", "Database layer"),
        ],

        "Basic Network Architecture": [
            ("Public", "Public", "Public entry layer"),
            ("Private", "Private", "Internal resources"),
        ],
    }

    tiers = architecture_tiers.get(
        architecture_type,
        architecture_tiers["Basic Network Architecture"],
    )

    # Simulate subnet replicas for very high availability.
    subnet_count_per_tier = (
        2
        if availability in ["Very High", "Mission Critical"]
        else 1
    )

    available_subnets = list(network.subnets(new_prefix=24))

    subnets = []
    subnet_index = 0

    for tier_name, subnet_type, purpose in tiers:

        for replica in range(subnet_count_per_tier):

            if subnet_index >= len(available_subnets):
                raise ValueError("Subnet CIDR allocation exhausted.")

            subnet_network = available_subnets[subnet_index]
            subnet_index += 1

            suffix = (
                f"-zone-{replica + 1}"
                if subnet_count_per_tier == 2
                else ""
            )

            subnets.append(
                SubnetPlan(
                    subnet_name=f"{tier_name.lower()}-subnet{suffix}",
                    tier=tier_name,
                    cidr_block=str(subnet_network),
                    subnet_type=subnet_type,
                    purpose=purpose,
                )
            )

    return subnets


# ============================================================
# 3. NETWORK COMPONENT PLANNING
# ============================================================

def plan_network_components(
    provider: str,
    architecture_type: str,
    subnets: list[SubnetPlan],
) -> list[NetworkComponent]:
    """
    Select simulated network components for AWS, Azure, or GCP.
    """

    components = []

    has_public_subnets = any(
        subnet.subnet_type == "Public"
        for subnet in subnets
    )

    has_private_subnets = any(
        subnet.subnet_type == "Private"
        for subnet in subnets
    )

    provider_components = {
        "AWS": [
            (
                "Virtual Private Cloud",
                "VPC",
                "Isolated cloud network",
            ),
            (
                "Route Tables",
                "Routing",
                "Controls subnet traffic routes",
            ),
            (
                "Security Groups",
                "Firewall",
                "Controls resource-level traffic",
            ),
        ],

        "Azure": [
            (
                "Virtual Network",
                "VNet",
                "Isolated Azure network",
            ),
            (
                "Network Security Groups",
                "Firewall",
                "Controls network traffic",
            ),
            (
                "Route Tables",
                "Routing",
                "Controls subnet traffic routes",
            ),
        ],

        "GCP": [
            (
                "Virtual Private Cloud",
                "VPC",
                "Cloud network environment",
            ),
            (
                "Firewall Rules",
                "Firewall",
                "Controls ingress and egress traffic",
            ),
            (
                "Routes",
                "Routing",
                "Determines network traffic paths",
            ),
        ],
    }

    if provider not in provider_components:
        raise ValueError(
            f"Unsupported cloud provider: {provider}"
        )

    # Add provider's base network components.
    for name, component_type, purpose in provider_components[provider]:
        components.append(
            NetworkComponent(
                component_name=name,
                component_type=component_type,
                purpose=purpose,
            )
        )

    # Add simulated public connectivity component.
    if has_public_subnets:

        public_components = {
            "AWS": [
                (
                    "Internet Gateway",
                    "Gateway",
                    "Provides simulated internet connectivity",
                ),
            ],

            "Azure": [
                (
                    "Public IP / Internet Connectivity",
                    "Connectivity",
                    "Represents internet-facing connectivity",
                ),
            ],

            "GCP": [
                (
                    "Internet Gateway Connectivity",
                    "Connectivity",
                    "Represents internet connectivity",
                ),
            ],
        }

        for name, component_type, purpose in public_components[provider]:
            components.append(
                NetworkComponent(
                    component_name=name,
                    component_type=component_type,
                    purpose=purpose,
                )
            )

    # Add simulated NAT component for public/private networks.
    if has_public_subnets and has_private_subnets:

        nat_components = {
            "AWS": [
                (
                    "NAT Gateway",
                    "NAT",
                    "Represents outbound internet access for private resources",
                ),
            ],

            "Azure": [
                (
                    "NAT Gateway",
                    "NAT",
                    "Represents outbound internet access for private resources",
                ),
            ],

            "GCP": [
                (
                    "Cloud NAT",
                    "NAT",
                    "Represents outbound internet access for private resources",
                ),
            ],
        }

        for name, component_type, purpose in nat_components[provider]:
            components.append(
                NetworkComponent(
                    component_name=name,
                    component_type=component_type,
                    purpose=purpose,
                )
            )

    return components


# ============================================================
# 4. CONNECTIVITY FLOW PLANNING
# ============================================================

def plan_connectivity_flow(
    subnets: list[SubnetPlan],
) -> list[str]:
    """
    Generate a simulated connectivity flow between subnet tiers.
    """

    tiers = list(
        dict.fromkeys(subnet.tier for subnet in subnets)
    )

    flow = []

    has_public_subnets = any(
        subnet.subnet_type == "Public"
        for subnet in subnets
    )

    has_private_subnets = any(
        subnet.subnet_type == "Private"
        for subnet in subnets
    )

    # Internet to public entry layer.
    if "Public" in tiers:
        flow.append("Internet → Public Subnet")

    # Public entry layer to application layer.
    if "Application" in tiers:

        if "Public" in tiers:
            flow.append(
                "Public Subnet → Application Subnet"
            )
        else:
            flow.append(
                "Application Access → Application Subnet"
            )

    # Application layer to database layer.
    if "Application" in tiers and "Database" in tiers:
        flow.append(
            "Application Subnet → Database Subnet"
        )

    # Database-only architecture.
    if "Database" in tiers and "Application" not in tiers:
        flow.append(
            "Network Access → Database Subnet"
        )

    # Internal access for a basic private tier.
    if (
        "Private" in tiers
        and "Application" not in tiers
        and "Database" not in tiers
    ):
        flow.append(
            "Internal Access → Private Subnet"
        )

    # Simulated outbound access from private subnets.
    if has_public_subnets and has_private_subnets:
        flow.append(
            "Private Subnets → NAT Gateway → Outbound Internet"
        )

    return flow


# ============================================================
# 5. DESIGN RATIONALE
# ============================================================

def generate_design_rationale(
    architecture_type: str,
    availability: str,
    provider: str,
    subnets: list[SubnetPlan],
) -> list[str]:
    """
    Generate explanations for the selected simulated topology.
    """

    rationale = []

    architecture_explanations = {
        "Three-Tier Web Architecture":
            "The workload is organized into public, application, "
            "and database layers to separate traffic entry, processing, "
            "and data storage.",

        "Database-Centric Architecture":
            "The network separates the application access layer "
            "from the database layer to provide logical isolation.",

        "API / Service Architecture":
            "The network provides an entry layer and a private "
            "application layer for backend services.",

        "High-Availability Architecture":
            "The network is designed with redundant subnet placement "
            "to represent improved availability.",

        "Scalable Multi-Tier Architecture":
            "The network separates layers to represent independent "
            "scaling of different workload components.",

        "Basic Network Architecture":
            "The network uses a basic public and private separation "
            "for workload connectivity.",
    }

    # Architecture reasoning.
    rationale.append(
        architecture_explanations.get(
            architecture_type,
            "A basic network architecture was selected.",
        )
    )

    # Availability reasoning.
    if availability in ["Very High", "Mission Critical"]:
        rationale.append(
            "Multiple simulated subnets are allocated per tier "
            "to represent redundant network placement."
        )

    elif availability == "High":
        rationale.append(
            "High availability is requested. This version of the "
            "simulation does not duplicate each subnet for this level."
        )

    else:
        rationale.append(
            "The design uses a standard subnet layout without "
            "additional simulated subnet replicas."
        )

    # Public/private isolation reasoning.
    has_public_subnets = any(
        subnet.subnet_type == "Public"
        for subnet in subnets
    )

    has_private_subnets = any(
        subnet.subnet_type == "Private"
        for subnet in subnets
    )

    if has_public_subnets and has_private_subnets:
        rationale.append(
            "Public and private subnet separation distinguishes "
            "internet-facing entry points from internal workloads."
        )

    if has_private_subnets:
        rationale.append(
            "Private subnets represent internal resources that "
            "should not be directly exposed to the internet."
        )

    # Provider reasoning.
    provider_explanations = {
        "AWS": "AWS networking components are selected for the simulated design.",
        "Azure": "Azure networking components are selected for the simulated design.",
        "GCP": "GCP networking components are selected for the simulated design.",
    }

    rationale.append(
        provider_explanations.get(
            provider,
            f"{provider} networking components are selected.",
        )
    )

    # Simulation disclaimer.
    rationale.append(
        "CIDR blocks are allocated from the simulated 10.0.0.0/16 "
        "network. No real cloud infrastructure is deployed."
    )

    return rationale
