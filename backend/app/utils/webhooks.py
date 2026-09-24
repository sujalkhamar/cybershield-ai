import requests
import os
import json
from datetime import datetime

# You can set these in your environment or hardcode for testing
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "")
JIRA_WEBHOOK_URL = os.getenv("JIRA_WEBHOOK_URL", "")
PAGERDUTY_WEBHOOK_URL = os.getenv("PAGERDUTY_WEBHOOK_URL", "")

def send_slack_alert(ip, prediction_class, mse):
    """Sends a critical alert to Slack."""
    if not SLACK_WEBHOOK_URL:
        return
        
    payload = {
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🚨 CRITICAL ZERO-DAY DETECTED 🚨",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Target IP:*\n`{ip}`"},
                    {"type": "mrkdwn", "text": f"*Classification:*\n{prediction_class}"},
                    {"type": "mrkdwn", "text": f"*Autoencoder MSE:*\n`{mse:.4f}` (Threshold > 5.0)"},
                    {"type": "mrkdwn", "text": f"*Timestamp:*\n{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"}
                ]
            }
        ]
    }
    
    try:
        requests.post(SLACK_WEBHOOK_URL, json=payload, timeout=3)
    except Exception as e:
        print(f"Slack webhook failed: {e}")

def send_jira_ticket(ip, mse):
    """Simulates creating a Jira Service Desk ticket."""
    if not JIRA_WEBHOOK_URL:
        return
        
    payload = {
        "fields": {
            "project": {"key": "SOC"},
            "summary": f"Incident: Zero-Day Anomaly at {ip}",
            "description": f"CyberShield-AI detected an anomalous payload. MSE Loss: {mse}",
            "issuetype": {"name": "Bug"},
            "priority": {"name": "Highest"}
        }
    }
    try:
        requests.post(JIRA_WEBHOOK_URL, json=payload, timeout=3)
    except:
        pass

def trigger_pagerduty(ip):
    """Simulates triggering a PagerDuty incident."""
    if not PAGERDUTY_WEBHOOK_URL:
        return
        
    payload = {
        "routing_key": PAGERDUTY_WEBHOOK_URL,
        "event_action": "trigger",
        "payload": {
            "summary": f"Critical Security Breach Attempt at {ip}",
            "severity": "critical",
            "source": "CyberShield-AI Edge Node"
        }
    }
    try:
        requests.post("https://events.pagerduty.com/v2/enqueue", json=payload, timeout=3)
    except:
        pass

def dispatch_alerts(ip, prediction_class, mse, is_zero_day):
    """Dispatches all configured webhooks."""
    if is_zero_day:
        send_slack_alert(ip, prediction_class, mse)
        send_jira_ticket(ip, mse)
        trigger_pagerduty(ip)
