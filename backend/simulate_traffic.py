import pandas as pd
import requests
import time
import random
import json
import numpy as np

# Configuration
DATASET_PATH = r"D:\SGP\datasets\CICIDS.csv"
API_URL = "http://127.0.0.1:8000/api/v1/predict"

print("🛡️ CyberShield-AI Live Traffic Simulator")
print(f"Loading real telemetry from {DATASET_PATH}...")

try:
    # Load dataset, coercing errors to handle repeated headers
    df = pd.read_csv(DATASET_PATH, low_memory=False)
    # Drop the Label column (which is usually the last one, 78th index)
    features_df = df.iloc[:, :-1]
    
    # Convert all to numeric, replacing strings with NaN
    features_df = features_df.apply(pd.to_numeric, errors='coerce')
    # Drop any row that got turned into NaN or inf
    features_df = features_df.replace([np.inf, -np.inf], np.nan).dropna()
    
    print(f"✅ Successfully loaded {len(features_df)} network flows.")
    print("🚀 Commencing Live Traffic Injection to the Backend API...")
    print("Press CTRL+C to stop.\n")
    
    while True:
        # Pick a random network flow
        random_index = random.randint(0, len(features_df) - 1)
        row = features_df.iloc[random_index].values.tolist()
        
        # The dataset has 78 features, but our AI models were built expecting 79 
        # (Based on the PPT saying '79 features'). We append a 0 to match dimensions!
        if len(row) == 78:
            row.append(0.0)
            
        clean_row = [float(x) for x in row]
        
        # Generate random IPs to simulate a real network environment
        src_ip = f"192.168.1.{random.randint(2, 254)}"
        dst_ip = f"10.0.{random.randint(0,5)}.{random.randint(1, 254)}"
        
        # Build the API Request Payload
        payload = {
            "source_ip": src_ip,
            "destination_ip": dst_ip,
            "features": clean_row
        }
        
        # Send to FastAPI Backend
        try:
            response = requests.post(API_URL, json=payload)
            if response.status_code == 201:
                data = response.json()
                classification = data.get("prediction_class")
                is_zero_day = data.get("is_zero_day")
                mse = data.get("reconstruction_mse")
                
                if is_zero_day:
                    print(f"[🔥 ZERO-DAY] IP: {src_ip} -> {dst_ip} | MSE: {mse}")
                elif classification != "Benign":
                    print(f"[⚠️ THREAT] IP: {src_ip} -> {dst_ip} | Class: {classification}")
                else:
                    print(f"[✅ SECURE] IP: {src_ip} -> {dst_ip} | Benign Traffic")
            else:
                print(f"[❌ ERROR] API returned status {response.status_code}")
        except Exception as e:
            print(f"[❌ ERROR] Failed to connect to API: {e}")
            
        # Wait a few seconds before sending the next packet
        # (This makes the dashboard look like a steady stream of traffic)
        time.sleep(random.uniform(1.5, 4.0))

except FileNotFoundError:
    print(f"[❌ ERROR] Could not find dataset at {DATASET_PATH}. Please check the path.")
except KeyboardInterrupt:
    print("\n🛑 Traffic Simulator stopped.")
