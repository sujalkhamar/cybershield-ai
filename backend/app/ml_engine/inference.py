import torch
import numpy as np
from app.ml_engine.lstm import CyberShieldLSTM
from app.ml_engine.autoencoder import CyberShieldAutoencoder

# Initialize models globally so they don't reload on every API request
# In a real scenario, we would load the trained weights here: lstm_model.load_state_dict(torch.load('lstm.pth'))
lstm_model = CyberShieldLSTM(input_size=79, hidden_size=64, num_layers=2, num_classes=5)
lstm_model.eval() # Set to evaluation mode

autoencoder_model = CyberShieldAutoencoder(input_size=79)
autoencoder_model.eval()

# Prediction classes mapping
CLASSES = ["Benign", "DDoS", "PortScan", "BruteForce", "Botnet"]
ZERO_DAY_THRESHOLD = 5.0 # The tau threshold for reconstruction loss

def run_ai_inference(raw_features: list):
    """
    Takes 79 raw network features, applies inference, and returns prediction details.
    """
    # 1. Convert to PyTorch Tensor
    # In reality, you'd apply your fitted StandardScaler here first!
    features_tensor = torch.tensor(raw_features, dtype=torch.float32)
    
    # 2. Add batch dimension for LSTM (Batch, SequenceLength, Features) -> (1, 1, 79)
    lstm_input = features_tensor.unsqueeze(0).unsqueeze(0)
    
    with torch.no_grad():
        # --- STAGE 1: Known Attack Classification (LSTM) ---
        lstm_out = lstm_model(lstm_input)
        probabilities = torch.softmax(lstm_out, dim=1).squeeze()
        
        # Get the highest probability class
        max_prob_value, max_prob_index = torch.max(probabilities, dim=0)
        predicted_class = CLASSES[max_prob_index.item()]
        confidence = round(max_prob_value.item(), 4)

        # --- STAGE 2: Zero-Day Anomaly Detection (Autoencoder) ---
        # Autoencoder input needs shape (1, 79)
        ae_input = features_tensor.unsqueeze(0)
        reconstructed = autoencoder_model(ae_input)
        
        # Compute MSE
        mse_loss = autoencoder_model.compute_reconstruction_loss(ae_input, reconstructed)
        
    # --- DECISION LOGIC ---
    is_zero_day = 1 if mse_loss > ZERO_DAY_THRESHOLD else 0
    
    if is_zero_day == 1:
        predicted_class = "Zero-Day"
        
    return predicted_class, confidence, mse_loss, is_zero_day
