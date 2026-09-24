import torch
import shap
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os
from module_1_data_prep import load_and_clean_data
from module_2_ai_models import SignatureLSTM

def run_actual_xai():
    print("--- CyberShield-AI: Actual SHAP Explainable AI ---")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(script_dir, "CICIDS.csv")
    model_path = os.path.join(script_dir, "lstm_model.pth")
    
    if not os.path.exists(model_path):
        print("ERROR: lstm_model.pth not found! Please run train_models.py first.")
        return

    # 1. Load a sample of data
    print("[+] Loading Dataset for SHAP Interpretation...")
    scaled_features, labels, scaler = load_and_clean_data(dataset_path, sample_size=1000)
    feature_names = scaled_features.columns.tolist()
    
    X_tensor = torch.tensor(scaled_features.values, dtype=torch.float32)
    # Add sequence dimension for LSTM: (batch, seq, features)
    X_seq = X_tensor.unsqueeze(1)
    
    # 2. Load the actual trained PyTorch LSTM model
    print("[+] Loading trained LSTM model...")
    num_features = scaled_features.shape[1]
    num_classes = len(labels.unique())
    
    model = SignatureLSTM(input_features=num_features, num_classes=num_classes)
    model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
    model.eval()
    
    # 3. Create a custom wrapper for SHAP since it doesn't natively handle LSTM seq shapes perfectly
    class ModelWrapper(torch.nn.Module):
        def __init__(self, lstm_model):
            super().__init__()
            self.model = lstm_model
        def forward(self, x):
            # Reshape 2D tensor back to 3D for LSTM
            x_seq = x.unsqueeze(1)
            return self.model(x_seq)
            
    wrapped_model = ModelWrapper(model)

    # 4. Generate SHAP values using actual PyTorch DeepExplainer
    print("[+] Running SHAP DeepExplainer (This may take a moment)...")
    # Background dataset for SHAP to integrate over (use 100 random samples)
    background = X_tensor[:100]
    test_samples = X_tensor[100:105] # Select 5 samples to explain
    
    explainer = shap.DeepExplainer(wrapped_model, background)
    shap_values = explainer.shap_values(test_samples)
    
    print("\n[✓] SHAP Values successfully calculated directly from the PyTorch model!")
    
    # 5. Visualize the actual SHAP values
    print("[+] Generating Summary Plot...")
    
    # shap_values is a list of arrays (one per class). We visualize the first class (e.g. Benign/Attack)
    # Using matplotlib to ensure it displays properly in your environment
    plt.style.use('dark_background')
    fig = plt.figure(figsize=(10, 6))
    fig.canvas.manager.set_window_title('CyberShield-AI: Actual SHAP Values')
    
    # shap.summary_plot handles the matplotlib plotting internally
    shap.summary_plot(shap_values[0], test_samples.numpy(), feature_names=feature_names, show=False)
    
    plt.title("Actual SHAP Feature Attributions (from PyTorch Model)", color="white", pad=20)
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    run_actual_xai()
