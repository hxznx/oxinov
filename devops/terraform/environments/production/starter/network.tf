# A small dedicated VPC for the starter server (ADR-017): one public subnet, no NAT gateway (the server
# has a public address), so the network itself costs nothing. The ECS/RDS layout of ADR-009 replaces it.

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "starter" {
  cidr_block           = "10.40.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = local.name }
}

resource "aws_internet_gateway" "starter" {
  vpc_id = aws_vpc.starter.id
  tags   = { Name = local.name }
}

resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.starter.id
  cidr_block        = "10.40.0.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]
  # The server gets an Elastic IP instead of an automatic public address.
  map_public_ip_on_launch = false

  tags = { Name = "${local.name}-public" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.starter.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.starter.id
  }

  tags = { Name = "${local.name}-public" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Lock down the VPC's default security group so nothing can use it by accident.
resource "aws_default_security_group" "starter" {
  vpc_id = aws_vpc.starter.id
}

# Only HTTP (for the certificate challenge and the redirect) and HTTPS are open. There is no SSH:
# administrators connect through Systems Manager Session Manager.
resource "aws_security_group" "server" {
  name        = "${local.name}-server"
  description = "Starter server: web traffic in, everything out"
  vpc_id      = aws_vpc.starter.id

  tags = { Name = "${local.name}-server" }
}

# Accepted: public website.
#trivy:ignore:AWS-0107
resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.server.id
  description       = "HTTP for ACME challenges and redirects to HTTPS"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

# Accepted: public website.
#trivy:ignore:AWS-0107
resource "aws_vpc_security_group_ingress_rule" "https" {
  security_group_id = aws_security_group.server.id
  description       = "HTTPS for edu, app, and id"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

# Accepted: the server calls AWS and registries over the internet.
#trivy:ignore:AWS-0104
resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.server.id
  description       = "Image pulls, AWS APIs, OS updates, and certificate issuance"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}
