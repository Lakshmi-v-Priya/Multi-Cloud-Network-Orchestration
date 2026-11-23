import re


# --------------------------------------------------
# Provider and Region Mapping
# --------------------------------------------------

PROVIDER_REGIONS = {
    "AWS": {
        "India": "ap-south-1",
        "Mumbai": "ap-south-1",
        "Chennai": "ap-south-1",
        "US": "us-east-1",
        "USA": "us-east-1",
    },
    "Azure": {
        "India": "Central India",
        "Mumbai": "Central India",
        "Chennai": "South India",
        "US": "East US",
        "USA": "East US",
    },
    "GCP": {
        "India": "asia-south1",
        "Mumbai": "asia-south1",
        "Chennai": "asia-south2",
        "US": "us-central1",
        "USA": "us-central1",
    },
}


# --------------------------------------------------
# Utility Functions
# --------------------------------------------------

def safe_name(value: str) -> str:
    """
    Convert a resource name into a valid Terraform identifier.
    """
    value = value.lower()
    value = re.sub(r"[^a-z0-9_]", "_", value)
    value = re.sub(r"_+", "_", value)
    return value.strip("_")


def resolve_region(provider: str, region: str) -> str:
    """
    Map user-friendly regions to provider-specific regions.
    """
    provider_regions = PROVIDER_REGIONS.get(provider, {})

    return provider_regions.get(region, region)


def get_provider_block(provider: str, region: str) -> str:
    """
    Generate Terraform provider configuration.
    """

    region = resolve_region(provider, region)

    if provider == "AWS":
        return f'''terraform {{
  required_providers {{
    aws = {{
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }}
  }}
}}

provider "aws" {{
  region = "{region}"
}}
'''

    elif provider == "Azure":
        return f'''terraform {{
  required_providers {{
    azurerm = {{
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }}
  }}
}}

provider "azurerm" {{
  features {{}}
}}
'''

    elif provider == "GCP":
        return f'''terraform {{
  required_providers {{
    google = {{
      source  = "hashicorp/google"
      version = "~> 6.0"
    }}
  }}
}}

provider "google" {{
  region = "{region}"
}}
'''

    else:
        raise ValueError(f"Unsupported provider: {provider}")


# --------------------------------------------------
# Terraform Generator
# --------------------------------------------------

def generate_terraform_configuration(deployment):

    provider = deployment.provider
    region = deployment.region

    # Resolve provider-specific region
    mapped_region = resolve_region(provider, region)

    # Generate provider configuration
    terraform_code = get_provider_block(
        provider,
        region,
    )

    terraform_code += "\n\n"

    # --------------------------------------------------
    # Resource Generation
    # --------------------------------------------------

    for resource in deployment.resources:

        resource_name = safe_name(
            resource["resource_name"]
        )

        resource_type = resource["resource_type"]

        configuration = resource.get(
            "configuration", {}
        )

        terraform_code += (
            f"# Resource: {resource_name}\n"
            f"# Type: {resource_type}\n"
            f"# Purpose: {resource.get('purpose', '')}\n"
        )

        # --------------------------------------------------
        # AWS Resources
        # --------------------------------------------------

        if provider == "AWS":

            if resource_name == "application_network":

                terraform_code += f'''
resource "aws_vpc" "{resource_name}" {{
  cidr_block           = "10.0.0.0/16"
  enable_dns_support    = true
  enable_dns_hostnames = true

  tags = {{
    Name = "{resource_name}"
  }}
}}
'''

            elif resource_name == "application_security":

                terraform_code += f'''
resource "aws_security_group" "{resource_name}" {{
  name        = "{resource_name}"
  description = "Generated security configuration"
  vpc_id     = aws_vpc.application_network.id

  ingress {{
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }}

  ingress {{
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }}

  tags = {{
    Name = "{resource_name}"
  }}
}}
'''

            elif resource_name == "application_storage":

                capacity = configuration.get(
                    "capacity_GB", 100
                )

                terraform_code += f'''
resource "aws_ebs_volume" "{resource_name}" {{
  availability_zone = "{mapped_region}a"
  size             = {capacity}
  type             = "gp3"

  tags = {{
    Name = "{resource_name}"
  }}
}}
'''

            elif resource_name == "application_compute":

                instance_type = configuration.get(
                    "instance_type", "t3.medium"
                )

                terraform_code += f'''
resource "aws_instance" "{resource_name}" {{
  ami           = "ami-PLACEHOLDER"
  instance_type  = "{instance_type}"

  vpc_security_group_ids = [
    aws_security_group.application_security.id
  ]

  tags = {{
    Name = "{resource_name}"
  }}
}}
'''

        # --------------------------------------------------
        # Azure Resources
        # --------------------------------------------------

        elif provider == "Azure":

            terraform_code += f'''
# Azure resource placeholder for {resource_name}
# Planned resource type: {resource_type}
# Configuration: {configuration}
# Implemented resource mapping will be added next.
'''

        # --------------------------------------------------
        # GCP Resources
        # --------------------------------------------------

        elif provider == "GCP":

            terraform_code += f'''
# GCP resource placeholder for {resource_name}
# Planned resource type: {resource_type}
# Configuration: {configuration}
# Implemented resource mapping will be added next.
'''

        terraform_code += "\n\n"

    # --------------------------------------------------
    # Return Generated Terraform Code
    # --------------------------------------------------

    return {
        "intent_id": deployment.intent_id,
        "provider": provider,
        "region": mapped_region,
        "terraform_code": terraform_code,
        "file_name": "main.tf",
        "is_simulation": True,
        "disclaimer": (
            "Generated Terraform code is for review and simulation. "
            "It contains placeholders and has not been validated or applied. "
            "No cloud resources have been created."
        ),
    }