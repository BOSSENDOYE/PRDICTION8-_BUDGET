import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib
import os

DATA_PATH = 'data/donnees_communes.xlsx'
MODEL_DIR = 'ml/model'
os.makedirs(MODEL_DIR, exist_ok=True)

def prepare_data():
    df = pd.read_excel(DATA_PATH)
    df.columns = df.columns.str.replace(' (M€)', '', regex=False)
    df = df.dropna()
    communes = df['Commune'].unique()
    models = {}
    for commune in communes:
        df_commune = df[df['Commune'] == commune]
        X = df_commune[['Année']].values
        y = df_commune[['Recettes', 'Dépenses']].values
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        model_path = os.path.join(MODEL_DIR, f'model_{commune}.joblib')
        joblib.dump(model, model_path)
        models[commune] = model_path
    return models, communes.tolist()

if __name__ == '__main__':
    models, communes = prepare_data()
    print(f"Trained models for communes: {communes}")
    print(f"Models saved in: {MODEL_DIR}")