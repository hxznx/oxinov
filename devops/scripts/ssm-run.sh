#!/usr/bin/env bash
# Shared helpers for running commands on the starter server through Systems Manager (no SSH).
# Source it:  source devops/scripts/ssm-run.sh
# Needs the AWS CLI with credentials for the deploy role or an administrator, and region ap-south-1.

: "${AWS_REGION:=ap-south-1}"
export AWS_REGION AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-$AWS_REGION}"

# Prints the running starter server's instance ID (found by its Name tag).
starter_instance() {
  local id
  id=$(aws ec2 describe-instances \
    --filters Name=tag:Name,Values=oxinov-starter Name=instance-state-name,Values=running \
    --query 'Reservations[0].Instances[0].InstanceId' --output text)
  if [ -z "$id" ] || [ "$id" = None ]; then
    echo "starter server not found" >&2
    return 1
  fi
  echo "$id"
}

# ssm_run <instance> <shell script> [timeout seconds, default 600]
# Runs the script as root, streams nothing while it runs, then prints its output and returns its status.
ssm_run() {
  local instance=$1 script=$2 timeout=${3:-600} params command status
  params=$(jq -n --arg s "$script" --arg t "$timeout" '{commands: [$s], executionTimeout: [$t]}')
  command=$(aws ssm send-command --instance-ids "$instance" --document-name AWS-RunShellScript \
    --comment "oxinov starter" --parameters "$params" --query Command.CommandId --output text)
  local deadline=$((SECONDS + timeout + 60))
  while :; do
    status=$(aws ssm get-command-invocation --command-id "$command" --instance-id "$instance" \
      --query Status --output text 2>/dev/null || echo Pending)
    case $status in Pending | InProgress | Delayed) ;; *) break ;; esac
    if [ "$SECONDS" -gt "$deadline" ]; then status=TimedOut; break; fi
    sleep 5
  done
  aws ssm get-command-invocation --command-id "$command" --instance-id "$instance" \
    --query StandardOutputContent --output text 2>/dev/null || true
  aws ssm get-command-invocation --command-id "$command" --instance-id "$instance" \
    --query StandardErrorContent --output text 2>/dev/null | sed '/^None$/d' >&2 || true
  [ "$status" = Success ] || { echo "command $command ended with status $status" >&2; return 1; }
}
