variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "callflow-ai"
}

variable "environment" {
  description = "Environment (dev/staging/prod)"
  type        = string
  default     = "staging"
}

variable "db_password" {
  description = "RDS root password"
  type        = string
  sensitive   = true
}
