import torch
import torch.nn as nn

class CyberShieldAutoencoder(nn.Module):
    def __init__(self, input_size=79):
        """
        PyTorch Deep Autoencoder for detecting Zero-Day attacks using reconstruction loss (MSE > threshold).
        It compresses the 79 features down to a bottleneck of 8, and tries to reconstruct them.
        """
        super(CyberShieldAutoencoder, self).__init__()
        
        # Encoder: 79 -> 64 -> 32 -> 16 -> 8
        self.encoder = nn.Sequential(
            nn.Linear(input_size, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 8),
            nn.ReLU()
        )
        
        # Decoder: 8 -> 16 -> 32 -> 64 -> 79
        self.decoder = nn.Sequential(
            nn.Linear(8, 16),
            nn.ReLU(),
            nn.Linear(16, 32),
            nn.ReLU(),
            nn.Linear(32, 64),
            nn.ReLU(),
            nn.Linear(64, input_size),
            nn.Sigmoid() # Features should be normalized between 0 and 1
        )

    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded
        
    def compute_reconstruction_loss(self, x_original, x_reconstructed):
        """
        Computes the Mean Squared Error (MSE) between original and reconstructed input.
        If this MSE > threshold (tau), the SOC dashboard flags it as a Zero-Day Anomaly.
        """
        criterion = nn.MSELoss()
        loss = criterion(x_reconstructed, x_original)
        return loss.item()
