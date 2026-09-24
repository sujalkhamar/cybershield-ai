import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import os
import time

def load_and_clean_data(file_path, sample_size=10000):
    print(f"Loading dataset from: {file_path}...")
    start_time = time.time()
    
    # 1. Load the dataset (using a sample for fast live demonstration)
    # We use nrows to only load the first 10,000 rows so the presentation demo is instant!
    df = pd.read_csv(file_path, nrows=sample_size)
    print(f"Loaded {sample_size} rows in {time.time() - start_time:.2f} seconds.")
    
    # Clean column names (strip trailing spaces which are common in CICIDS2017)
    df.columns = df.columns.str.strip()
    
    # 1. Clean the data (Drop NaN and Infinite values)
    print("Initial shape:", df.shape)
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    df.dropna(inplace=True)
    print("Shape after cleaning:", df.shape)

    # Separate features (X) and labels (y)
    label_col = 'Label' if 'Label' in df.columns else df.columns[-1]
    X = df.drop(columns=[label_col])
    y = df[label_col]

    # Keep only numeric columns for scaling
    X_numeric = X.select_dtypes(include=[np.number])

    # 2. Apply StandardScaler (Z-score normalization)
    print("\nApplying StandardScaler algorithm...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_numeric)

    # Create a new DataFrame with the scaled data to view it easily
    df_scaled = pd.DataFrame(X_scaled, columns=X_numeric.columns)
    
    print("\n--- Module 1: Data Preprocessing Complete! ---")
    print("\nHere is a preview of your standardized data :")
    print(df_scaled.head())
    
    return df_scaled, y, scaler

if __name__ == "__main__":
    # Pointing exactly to the extracted CSV file in the same folder as this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(script_dir, "CICIDS.csv")
    
    if os.path.exists(dataset_path):
        # We process 10,000 rows for the fast Reporting 3 Live Demo
        scaled_features, labels, scaler_model = load_and_clean_data(dataset_path, sample_size=10000)
    else:
        print(f"File not found: {dataset_path}. Please make sure CICIDS.csv is in this folder.")
