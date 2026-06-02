resource "aws_secretsmanager_secret" "api_keys" {
  name = "${var.project_name}-api-keys"
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id     = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    OPENAI_API_KEY      = "placeholder"
    DEEPGRAM_API_KEY    = "placeholder"
    TWILIO_ACCOUNT_SID  = "placeholder"
    TWILIO_AUTH_TOKEN   = "placeholder"
  })
}
