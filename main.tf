terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}


# Resource: application_compute
# Type: Virtual Machine
# Purpose: Runs the application workload and handles application processing.

resource "aws_instance" "application_compute" {
  ami           = "ami-PLACEHOLDER"
  instance_type = "Demo-2vCPU-4GB"

  vpc_security_group_ids = [
    aws_security_group.application_security.id
  ]

  tags = {
    Name = "application_compute"
  }
}


# Resource: application_storage
# Type: Block Storage
# Purpose: Stores application files, data, and persistent information.

resource "aws_ebs_volume" "application_storage" {
  availability_zone = "ap-south-1a"
  size              = 50
  type              = "gp3"

  tags = {
    Name = "application_storage"
  }
}


# Resource: application_network
# Type: Virtual Network
# Purpose: Provides network connectivity for the application infrastructure.

resource "aws_vpc" "application_network" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "application_network"
  }
}


# Resource: application_security
# Type: Network Security Rules
# Purpose: Defines basic network access restrictions for the planned infrastructure.

resource "aws_security_group" "application_security" {
  name        = "application_security"
  description = "Generated security configuration"
  vpc_id      = aws_vpc.application_network.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "application_security"
  }
}



