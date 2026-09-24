terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket       = "oxinov-terraform-state-614130400110"
    key          = "production/edge/terraform.tfstate"
    region       = "ap-south-1"
    encrypt      = true
    use_lockfile = true
  }
}

locals {
  account_id = "614130400110"
  default_tags = {
    Project     = "oxinov"
    Environment = "production"
    Stack       = "edge"
    ManagedBy   = "terraform"
  }
}

provider "aws" {
  region              = "ap-south-1"
  allowed_account_ids = [local.account_id]

  default_tags {
    tags = local.default_tags
  }
}

# CloudFront only accepts certificates from us-east-1.
provider "aws" {
  alias               = "us_east_1"
  region              = "us-east-1"
  allowed_account_ids = [local.account_id]

  default_tags {
    tags = local.default_tags
  }
}
