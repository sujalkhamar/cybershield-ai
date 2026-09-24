import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import pandas as pd
import numpy as np
import os
import time
from module_1_data_prep import load_and_clean_data
from module_2_ai_models import SignatureLSTM, ZeroDayAutoencoder

def train_and_save_models():
    print("--- CyberShield-AI: Actual Model Training Phase ---")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(script_dir, "CICIDS.csv")
    
    # 1. Load Data (Using 50,000 samples for a realistic but reasonable training time)
    scaled_features, labels, scaler = load_and_clean_data(dataset_path, sample_size=50000)
    
    # Map labels to integers for PyTorch CrossEntropyLoss
    # Assuming 'BENIGN' is 0, and others are 1,2,3,4...
    unique_labels = labels.unique()
    label_map = {label: idx for idx, label in enumerate(unique_labels)}
    mapped_labels = labels.map(label_map).values
    
    X_tensor = torch.tensor(scaled_features.values, dtype=torch.float32)
    y_tensor = torch.tensor(mapped_labels, dtype=torch.long)
    
    # Create DataLoader
    dataset = TensorDataset(X_tensor, y_tensor)
    dataloader = DataLoader(dataset, batch_size=256, shuffle=True)
    
    num_features = scaled_features.shape[1]
    num_classes = len(unique_labels)
    
    # ==========================================
    # 2. Train LSTM (Signature Classification)
    # ==========================================
    print("\n[+] Initializing LSTM Training...")
    lstm_model = SignatureLSTM(input_features=num_features, num_classes=num_classes)
    lstm_criterion = nn.CrossEntropyLoss()
    lstm_optimizer = optim.Adam(lstm_model.parameters(), lr=0.001)
    
    lstm_epochs = 5
    for epoch in range(lstm_epochs):
        lstm_model.train()
        total_loss = 0
        for batch_X, batch_y in dataloader:
            lstm_optimizer.zero_grad()
            # LSTM expects sequence format: (batch, seq_len, features)
            batch_X_seq = batch_X.unsqueeze(1) 
            outputs = lstm_model(batch_X_seq)
            loss = lstm_criterion(outputs, batch_y)
            loss.backward()
            lstm_optimizer.step()
            total_loss += loss.item()
        print(f"LSTM Epoch [{epoch+1}/{lstm_epochs}], Loss: {total_loss/len(dataloader):.4f}")
        
    torch.save(lstm_model.state_dict(), os.path.join(script_dir, "lstm_model.pth"))
    print("[✓] LSTM Model saved as lstm_model.pth")

    # ==========================================
    # 3. Train Autoencoder (Zero-Day Detection)
    # ==========================================
    print("\n[+] Initializing Autoencoder Training (Benign Traffic Only)...")
    # Train Autoencoder ONLY on BENIGN traffic so it learns normal behavior
    benign_idx = label_map.get('BENIGN', 0)
    benign_features = X_tensor[y_tensor == benign_idx]
    
    ae_dataset = TensorDataset(benign_features, benign_features)
    ae_dataloader = DataLoader(ae_dataset, batch_size=256, shuffle=True)
    
    ae_model = ZeroDayAutoencoder(input_features=num_features)
    ae_criterion = nn.MSELoss()
    ae_optimizer = optim.Adam(ae_model.parameters(), lr=0.001)
    
    ae_epochs = 5
    for epoch in range(ae_epochs):
        ae_model.train()
        total_loss = 0
        for batch_X, _ in ae_dataloader:
            ae_optimizer.zero_grad()
            reconstructed = ae_model(batch_X)
            loss = ae_criterion(reconstructed, batch_X)
            loss.backward()
            ae_optimizer.step()
            total_loss += loss.item()
        print(f"Autoencoder Epoch [{epoch+1}/{ae_epochs}], Loss: {total_loss/len(ae_dataloader):.4f}")

    torch.save(ae_model.state_dict(), os.path.join(script_dir, "autoencoder_model.pth"))
    print("[✓] Autoencoder Model saved as autoencoder_model.pth")
    print("\n[✓] ALL TRAINING COMPLETE! The final project models are now ready for inference.")

if __name__ == "__main__":
    train_and_save_models()
