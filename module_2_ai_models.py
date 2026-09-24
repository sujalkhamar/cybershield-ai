import torch
import torch.nn as nn
import os
import matplotlib.pyplot as plt
import time
from module_1_data_prep import load_and_clean_data

# ==========================================
# 1. Signature Classification Model (LSTM)
# ==========================================
class SignatureLSTM(nn.Module):
    def __init__(self, input_features, hidden_dim=64, num_classes=5):
        super(SignatureLSTM, self).__init__()
        self.lstm = nn.LSTM(input_features, hidden_dim, num_layers=2, batch_first=True)
        self.fc = nn.Linear(hidden_dim, num_classes)
        self.softmax = nn.Softmax(dim=1)

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        logits = self.fc(lstm_out[:, -1, :])
        return self.softmax(logits)

# ==========================================
# 2. Zero-Day Anomaly Model (Autoencoder)
# ==========================================
class ZeroDayAutoencoder(nn.Module):
    def __init__(self, input_features):
        super(ZeroDayAutoencoder, self).__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_features, 32),
            nn.ReLU(),
            nn.Linear(32, 8) 
        )
        self.decoder = nn.Sequential(
            nn.Linear(8, 32),
            nn.ReLU(),
            nn.Linear(32, input_features)
        )

    def forward(self, x):
        return self.decoder(self.encoder(x))

# ==========================================
# Live Dashboard Demonstration
# ==========================================
if __name__ == "__main__":
    print("--- Starting CyberShield-AI Live Threat Feed ---")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(script_dir, "CICIDS.csv")
    
    # Load 100 packets for the live feed
    scaled_features, _, _ = load_and_clean_data(dataset_path, sample_size=100)
    num_features = scaled_features.shape[1]
    
    tensor_data_ae = torch.tensor(scaled_features.values, dtype=torch.float32)

    # Inject a Zero-Day Attack at packet #80
    anomaly_index = 80
    tensor_data_ae[anomaly_index] = tensor_data_ae[anomaly_index] * 15.0  

    print("\nInitializing PyTorch Models...")
    autoencoder_model = ZeroDayAutoencoder(input_features=num_features)
    
    # Pre-calculate MSE for speed during animation
    with torch.no_grad():
        reconstructed_data = autoencoder_model(tensor_data_ae)
        mse_loss = torch.mean((tensor_data_ae - reconstructed_data) ** 2, dim=1).numpy()

    # --- LIVE DASHBOARD ANIMATION ---
    tau = 2.0  # Dynamic threshold
    
    plt.ion() # Turn on interactive mode for live plotting
    plt.style.use('dark_background')
    fig, ax = plt.subplots(figsize=(10, 5))
    
    fig.canvas.manager.set_window_title('CyberShield-AI Live SOC Feed')
    
    x_data, y_data = [], []
    
    print("\n[+] Launching Live Telemetry Dashboard...")
    
    # Animate the packets coming in real-time
    for i in range(len(mse_loss)):
        x_data.append(i)
        y_data.append(mse_loss[i])
        
        ax.clear()
        
        # Graph styling
        ax.set_xlim(0, 100)
        ax.set_ylim(0, max(mse_loss) + 2)
        ax.set_title('Real-Time Network Telemetry & Zero-Day Detection', fontsize=14, color='white', pad=15)
        ax.set_xlabel('Network Packet Stream (Time)', color='gray')
        ax.set_ylabel('Mean Squared Error (MSE)', color='gray')
        ax.grid(True, alpha=0.1)
        
        # Draw threshold
        ax.axhline(y=tau, color='#ff3333', linestyle='--', label=r'Zero-Day Threshold ($\tau$)')
        
        # Plot the live line
        ax.plot(x_data, y_data, color='#00ffcc', linewidth=2, label='Live MSE')
        
        # If the current packet triggers an alert, flash a red dot!
        if mse_loss[i] > tau:
            ax.scatter([i], [mse_loss[i]], color='red', s=150, zorder=5)
            ax.text(i - 15, mse_loss[i] + 1, "CRITICAL: Zero-Day Anomaly!", color='red', weight='bold')
            print(f"[{time.strftime('%H:%M:%S')}] ALERT: Zero-Day Anomaly Detected at packet {i}! MSE: {mse_loss[i]:.2f}")
        
        ax.legend(loc='upper left')
        
        # Update the graph window
        plt.draw()
        plt.pause(0.05) # Pause to simulate network speed
        
    plt.ioff() # Keep window open at the end
    print("\n[✓] Telemetry feed complete.")
    plt.show()
