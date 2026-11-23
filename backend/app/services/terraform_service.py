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
    Map user-friendly names and cross-cloud region identifiers
    to a region supported by the requested cloud provider.
    """
    provider_regions = PROVIDER_REGIONS.get(provider, {})
    normalized_region = region.strip().lower()

    # Normalize equivalent region names/codes to a common friendly key.
    region_aliases = {
        "india": "India",
        "mumbai": "Mumbai",
        "ap-south-1": "Mumbai",
        "asia-south1": "Mumbai",
        "chennai": "Chennai",
        "asia-south2": "Chennai",
        "central india": "India",
        "south india": "Chennai",
        "us": "US",
        "usa": "USA",
        "east us": "US",
        "us-east-1": "US",
        "us-central1": "US",
    }

    friendly_region = region_aliases.get(normalized_region, region)
    return provider_regions.get(friendly_region, region)


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


def resolve_aws_instance_type(instance_type: str) -> str:
    """
    Convert simulated instance types into AWS EC2 instance types.
    """

    instance_type_mapping = {
        "Demo-1vCPU-1GB": "t3.micro",
        "Demo-2vCPU-2GB": "t3.small",
        "Demo-2vCPU-4GB": "t3.medium",
        "Demo-4vCPU-8GB": "t3.large",
    }

    return instance_type_mapping.get(
        instance_type,
        "t3.medium",
    )


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

    # Read requested storage capacity once for Azure data disk generation.
    azure_disk_capacity = 100
    for item in deployment.resources:
        if safe_name(item.get("resource_name", "")) == "application_storage":
            azure_disk_capacity = item.get("configuration", {}).get("capacity_GB", 100)
            break

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

            # ------------------------------
            # VPC, Subnet, IGW and Routing
            # ------------------------------

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

resource "aws_subnet" "application_subnet" {{
  vpc_id                  = aws_vpc.{resource_name}.id
  cidr_block              = "10.0.1.0/24"
  availability_zone        = "{mapped_region}a"
  map_public_ip_on_launch = true

  tags = {{
    Name = "application_subnet"
  }}
}}

resource "aws_internet_gateway" "application_igw" {{
  vpc_id = aws_vpc.{resource_name}.id

  tags = {{
    Name = "application_igw"
  }}
}}

resource "aws_route_table" "application_route_table" {{
  vpc_id = aws_vpc.{resource_name}.id

  route {{
    cidr_block = "0.0.0.0/0"
    gateway_id  = aws_internet_gateway.application_igw.id
  }}

  tags = {{
    Name = "application_route_table"
  }}
}}

resource "aws_route_table_association" "application_route_association" {{
  subnet_id      = aws_subnet.application_subnet.id
  route_table_id = aws_route_table.application_route_table.id
}}
'''

            # ------------------------------
            # Security Group
            # ------------------------------

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

            # ------------------------------
            # EBS Storage
            # ------------------------------

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

            # ------------------------------
            # EC2 Compute
            # ------------------------------

            elif resource_name == "application_compute":

                simulated_instance_type = configuration.get(
                    "instance_type", "Demo-2vCPU-4GB"
                )

                instance_type = resolve_aws_instance_type(
                    simulated_instance_type
                )

                terraform_code += f'''
data "aws_ssm_parameter" "amazon_linux_2023" {{
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}}

resource "aws_instance" "{resource_name}" {{
  ami           = data.aws_ssm_parameter.amazon_linux_2023.value
  instance_type  = "{instance_type}"
  subnet_id     = aws_subnet.application_subnet.id

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

            # ------------------------------
            # Network Infrastructure
            # ------------------------------

            if resource_name == "application_network":

                terraform_code += f'''
resource "azurerm_resource_group" "application_resource_group" {{
  name     = "application-resource-group"
  location = "{mapped_region}"

  tags = {{
    project = "MultiCloud-Orchestrator"
  }}
}}

resource "azurerm_virtual_network" "application_vnet" {{
  name                = "application-vnet"
  address_space        = ["10.0.0.0/16"]
  location             = "{mapped_region}"
  resource_group_name  = azurerm_resource_group.application_resource_group.name

  tags = {{
    project = "MultiCloud-Orchestrator"
  }}
}}

resource "azurerm_subnet" "application_subnet" {{
  name                 = "application-subnet"
  resource_group_name   = azurerm_resource_group.application_resource_group.name
  virtual_network_name  = azurerm_virtual_network.application_vnet.name
  address_prefixes      = ["10.0.1.0/24"]
}}

resource "azurerm_network_security_group" "application_nsg" {{
  name                = "application-nsg"
  location             = "{mapped_region}"
  resource_group_name  = azurerm_resource_group.application_resource_group.name


  security_rule {{
    name                       = "Allow-HTTP"
    priority                   = 100
    direction                  = "Inbound"
    access                    = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range      = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }}

  security_rule {{
    name                       = "Allow-HTTPS"
    priority                  = 110
    direction                 = "Inbound"
    access                   = "Allow"
    protocol                  = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix     = "*"
    destination_address_prefix = "*"
  }}

  tags = {{
    project = "MultiCloud-Orchestrator"
  }}
}}

resource "azurerm_subnet_network_security_group_association" "application_nsg_association" {{
  subnet_id                 = azurerm_subnet.application_subnet.id
  network_security_group_id = azurerm_network_security_group.application_nsg.id
}}
'''

            # ------------------------------
            # Azure Compute
            # ------------------------------

            elif resource_name == "application_compute":

                terraform_code += f'''
variable "admin_ssh_public_key" {{
  description = "SSH public key for Azure VM authentication"
  type        = string
}}

resource "azurerm_public_ip" "application_public_ip" {{
  name                = "application-public-ip"
  location             = "{mapped_region}"
  resource_group_name  = azurerm_resource_group.application_resource_group.name
  allocation_method    = "Static"
  sku                 = "Standard"

  tags = {{
    project = "MultiCloud-Orchestrator"
  }}
}}

resource "azurerm_network_interface" "application_nic" {{
  name                = "application-nic"
  location             = "{mapped_region}"
  resource_group_name  = azurerm_resource_group.application_resource_group.name

  ip_configuration {{
    name                          = "application-ip-configuration"
    subnet_id                      = azurerm_subnet.application_subnet.id
    private_ip_address_allocation   = "Dynamic"
    public_ip_address_id           = azurerm_public_ip.application_public_ip.id
  }}

  tags = {{
    project = "MultiCloud-Orchestrator"
  }}
}}

resource "azurerm_linux_virtual_machine" "{resource_name}" {{
  name                = "application-vm"
  resource_group_name  = azurerm_resource_group.application_resource_group.name
  location             = "{mapped_region}"
  size                = "Standard_B1s"
  admin_username       = "azureuser"

  network_interface_ids = [
    azurerm_network_interface.application_nic.id
  ]

  admin_ssh_key {{
    username   = "azureuser"
    public_key = var.admin_ssh_public_key
  }}

  os_disk {{
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }}

  source_image_reference {{
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku      = "22_04-lts-gen2"
    version  = "latest"
  }}

  tags = {{
    project = "MultiCloud-Orchestrator"
  }}
}}

resource "azurerm_managed_disk" "application_data_disk" {{
  name                 = "application-data-disk"
  location             = "{mapped_region}"
  resource_group_name   = azurerm_resource_group.application_resource_group.name
  storage_account_type  = "Standard_LRS"
  create_option        = "Empty"
  disk_size_gb         = {azure_disk_capacity}

  tags = {{
    project = "MultiCloud-Orchestrator"
  }}
}}


resource "azurerm_virtual_machine_data_disk_attachment" "application_data_disk_attachment" {{
  managed_disk_id    = azurerm_managed_disk.application_data_disk.id
  virtual_machine_id = azurerm_linux_virtual_machine.{resource_name}.id
  lun               = 0
  caching            = "ReadWrite"
}}
'''

        # --------------------------------------------------
        # GCP Resources
        # --------------------------------------------------

        elif provider == "GCP":

            # ------------------------------
            # VPC and Subnet
            # ------------------------------

            if resource_name == "application_network":

                terraform_code += f"""
resource "google_compute_network" "application_network" {{
  name                    = "application-network"
  auto_create_subnetworks = false
}}

resource "google_compute_subnetwork" "application_subnet" {{
  name          = "application-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = "{mapped_region}"
  network       = google_compute_network.application_network.id
}}
"""

            # ------------------------------
            # Firewall Rules
            # ------------------------------

            elif resource_name == "application_security":

                terraform_code += """
resource "google_compute_firewall" "application_firewall" {
  name    = "application-firewall"
  network = google_compute_network.application_network.name

  allow {
    protocol = "tcp"
    ports   = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["application-server"]
}
"""

            # ------------------------------
            # Persistent Disk
            # ------------------------------

            elif resource_name == "application_storage":

                capacity = configuration.get("capacity_GB", 100)

                terraform_code += f"""
resource "google_compute_disk" "application_storage" {{
  name   = "application-data-disk"
  type   = "pd-balanced"
  zone   = "{mapped_region}-a"
  size  = {capacity}
}}
"""

            # ------------------------------
            # Compute Engine VM
            # ------------------------------

            elif resource_name == "application_compute":

                simulated_instance_type = configuration.get(
                    "instance_type", "Demo-2vCPU-4GB"
                )
                gcp_machine_type_mapping = {
                    "Demo-1vCPU-1GB": "e2-micro",
                    "Demo-2vCPU-2GB": "e2-small",
                    "Demo-2vCPU-4GB": "e2-medium",
                    "Demo-4vCPU-8GB": "e2-standard-4",
                }
                machine_type = gcp_machine_type_mapping.get(
                    simulated_instance_type, "e2-medium"
                )

                terraform_code += f"""
resource "google_compute_instance" "application_compute" {{
  name         = "application-vm"
  machine_type = "{machine_type}"
  zone         = "{mapped_region}-a"

  boot_disk {{
    initialize_params {{
      image = "projects/ubuntu-os-cloud/global/images/family/ubuntu-2204-lts"
      size  = 20
    }}
  }}

  network_interface {{
    subnetwork = google_compute_subnetwork.application_subnet.id
    access_config {{}}
  }}

  attached_disk {{
    source      = google_compute_disk.application_storage.id
    device_name = "application-data-disk"
    mode        = "READ_WRITE"
  }}

  tags = ["application-server"]
}}
"""

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
