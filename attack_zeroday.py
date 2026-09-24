import requests
import random
import time

API_URL = "http://127.0.0.1:8000/api/v1/predict"

print("==================================================")
print(" ⚠️  INITIATING MANUAL ZERO-DAY EXPLOIT INJECTION")
print("==================================================")
print("[+] Generating malicious network payload with extreme anomalies...")
time.sleep(1)

# Generate a payload with 79 features filled with mathematically extreme values.
# Since normal Z-score scaled values are usually between -3 and 3, 
# pushing them to 80.0+ guarantees the Autoencoder will fail to reconstruct it,
# causing a massive MSE spike (a guaranteed Zero-Day flag).
malicious_features = [random.uniform(80.0, 150.0) for _ in range(79)]

# Simulate a scary looking external IP attacking the internal network
attacker_ip = f"{random.randint(100, 255)}.{random.randint(10, 200)}.{random.randint(1, 100)}.{random.randint(1, 255)}"
victim_ip = "192.168.1.100"

payload = {
    "source_ip": attacker_ip,
    "destination_ip": victim_ip,
    "features": malicious_features
}

print(f"[+] Routing exploit from {attacker_ip} -> {victim_ip}")
print("[+] Executing payload delivery to CyberShield-AI Backend...")
time.sleep(1)

try:
    response = requests.post(API_URL, json=payload)
    if response.status_code == 201:
        data = response.json()
        mse = data.get("reconstruction_mse")
        
        print("\n💥 ZERO-DAY PAYLOAD DELIVERED SUCCESSFULLY!")
        print(f"➡️  Resulting Autoencoder MSE Loss: {mse}")
        
        if data.get("is_zero_day"):
            print("🚨 IMPACT CONFIRMED: The SOC Dashboard has caught the MSE spike and flagged a ZERO-DAY!")
            print("Check your React Dashboard immediately!")
        else:
            print("Payload delivered, but did not trigger Zero-Day threshold.")
    else:
        print(f"Failed to inject. Status code: {response.status_code}")
except Exception as e:
    print(f"Error connecting to backend: {e}. Is your FastAPI server running?")
