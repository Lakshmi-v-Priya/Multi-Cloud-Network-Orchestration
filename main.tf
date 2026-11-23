terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
}


# Resource: application_compute
# Type: Virtual Machine
# Purpose: Runs the application workload and handles application processing.

variable "admin_ssh_public_key" {
  description = "SSH public key for Azure VM authentication"
  type        = string
}

resource "azurerm_public_ip" "application_public_ip" {
  name                = "application-public-ip"
  location            = "Central India"
  resource_group_name = azurerm_resource_group.application_resource_group.name
  allocation_method   = "Static"
  sku                 = "Standard"

  tags = {
    project = "MultiCloud-Orchestrator"
  }
}

resource "azurerm_network_interface" "application_nic" {
  name                = "application-nic"
  location            = "Central India"
  resource_group_name = azurerm_resource_group.application_resource_group.name

  ip_configuration {
    name                          = "application-ip-configuration"
    subnet_id                     = azurerm_subnet.application_subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.application_public_ip.id
  }

  tags = {
    project = "MultiCloud-Orchestrator"
  }
}

resource "azurerm_linux_virtual_machine" "application_compute" {
  name                = "application-vm"
  resource_group_name = azurerm_resource_group.application_resource_group.name
  location            = "Central India"
  size                = "Standard_B1s"
  admin_username      = "azureuser"

  network_interface_ids = [
    azurerm_network_interface.application_nic.id
  ]

  admin_ssh_key {
    username   = "azureuser"
    public_key = var.admin_ssh_public_key
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  tags = {
    project = "MultiCloud-Orchestrator"
  }
}

resource "azurerm_managed_disk" "application_data_disk" {
  name                 = "application-data-disk"
  location             = "Central India"
  resource_group_name  = azurerm_resource_group.application_resource_group.name
  storage_account_type = "Standard_LRS"
  create_option        = "Empty"
  disk_size_gb         = 100

  tags = {
    project = "MultiCloud-Orchestrator"
  }
}


resource "azurerm_virtual_machine_data_disk_attachment" "application_data_disk_attachment" {
  managed_disk_id    = azurerm_managed_disk.application_data_disk.id
  virtual_machine_id = azurerm_linux_virtual_machine.application_compute.id
  lun                = 0
  caching            = "ReadWrite"
}


# Resource: application_storage
# Type: Block Storage
# Purpose: Stores application files, data, and persistent information.


# Resource: application_network
# Type: Virtual Network
# Purpose: Provides network connectivity for the application infrastructure.

resource "azurerm_resource_group" "application_resource_group" {
  name     = "application-resource-group"
  location = "Central India"

  tags = {
    project = "MultiCloud-Orchestrator"
  }
}

resource "azurerm_virtual_network" "application_vnet" {
  name                = "application-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = "Central India"
  resource_group_name = azurerm_resource_group.application_resource_group.name

  tags = {
    project = "MultiCloud-Orchestrator"
  }
}

resource "azurerm_subnet" "application_subnet" {
  name                 = "application-subnet"
  resource_group_name  = azurerm_resource_group.application_resource_group.name
  virtual_network_name = azurerm_virtual_network.application_vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_network_security_group" "application_nsg" {
  name                = "application-nsg"
  location            = "Central India"
  resource_group_name = azurerm_resource_group.application_resource_group.name


  security_rule {
    name                       = "Allow-HTTP"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Allow-HTTPS"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = {
    project = "MultiCloud-Orchestrator"
  }
}

resource "azurerm_subnet_network_security_group_association" "application_nsg_association" {
  subnet_id                 = azurerm_subnet.application_subnet.id
  network_security_group_id = azurerm_network_security_group.application_nsg.id
}


# Resource: application_security
# Type: Network Security Rules
# Purpose: Defines basic network access restrictions for the planned infrastructure.


