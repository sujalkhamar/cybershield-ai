import shap
import torch
import numpy as np
from app.ml_engine.lstm import CyberShieldLSTM

# Initialize the model (in production, load the trained FL weights)
lstm_model = CyberShieldLSTM(input_size=79, hidden_size=64, num_layers=2, num_classes=5)
lstm_model.eval()

# To use SHAP with PyTorch, we need a wrapper function that returns a numpy array
def predict_fn(features_numpy):
    """Wrapper for SHAP KernelExplainer to pass numpy arrays into PyTorch"""
    features_tensor = torch.tensor(features_numpy, dtype=torch.float32)
    # Add batch and sequence dimensions for LSTM: (Batch, 1, 79)
    lstm_input = features_tensor.unsqueeze(1)
    
    with torch.no_grad():
        output = lstm_model(lstm_input)
        probabilities = torch.softmax(output, dim=1).numpy()
    return probabilities

# In a real scenario, this would be a representative sample of your background training data
# For SGP demonstration, we use a zero-matrix background
background_data = np.zeros((10, 79))

# Initialize the SHAP Explainer
explainer = shap.KernelExplainer(predict_fn, background_data)

def generate_shap_explanation(raw_features: list, prediction_class_index: int):
    """
    Takes the raw features of an attack and calculates the SHAP values.
    Returns the top 5 features that contributed most to the AI's decision.
    """
    input_data = np.array([raw_features])
    
    # Calculate SHAP values
    shap_values = explainer.shap_values(input_data, silent=True)
    
    # SHAP values for the specific class that was predicted
    target_shap_values = shap_values[:, :, prediction_class_index][0]
    
    # Mock feature names since we don't have the CICIDS CSV loaded in memory here
    feature_names = [f"Feature_{i}" for i in range(79)]
    
    # Sort features by absolute SHAP value (most influential first)
    feature_importance = []
    for i in range(79):
        feature_importance.append({
            "feature": feature_names[i],
            "importance": float(target_shap_values[i])
        })
        
    feature_importance.sort(key=lambda x: abs(x["importance"]), reverse=True)
    
    # Return top 5 influential features
    return feature_importance[:5]
