
import pandas as pd
import pickle
import os
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

class FallbackPredictor:
    def __init__(self, target: str):
        self.target = target
        self.model = None
        self.le = LabelEncoder()
        
    def fit(self, df: pd.DataFrame, time_limit: int = 60) -> dict:
        print("FallbackPredictor: Fitting...")
        X = df.drop(columns=[self.target])
        y = df[self.target]
        
        # Heuristic for classification vs regression
        if y.dtype == 'object' or len(y.unique()) < 20:
            is_classification = True
            y = self.le.fit_transform(y.astype(str))
            model = RandomForestClassifier(n_estimators=50, n_jobs=-1)
        else:
            is_classification = False
            model = RandomForestRegressor(n_estimators=50, n_jobs=-1)
            
        # Preprocessing
        numeric_features = X.select_dtypes(include=['int64', 'float64']).columns
        categorical_features = X.select_dtypes(include=['object', 'bool']).columns

        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())])

        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
            ('onehot', OneHotEncoder(handle_unknown='ignore'))])

        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features)])

        self.model = Pipeline(steps=[('preprocessor', preprocessor),
                                     ('classifier', model)])

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self.model.fit(X_train, y_train)
        score = self.model.score(X_test, y_test)
        
        return {
            "score": score,
            "metric": "accuracy" if is_classification else "r2",
            "model": "RandomForest (Fallback)"
        }

    def predict(self, df: pd.DataFrame):
        if not self.model:
            raise Exception("Model not trained")
        preds = self.model.predict(df)
        if hasattr(self.le, 'classes_'):
             try:
                 preds = self.le.inverse_transform(preds.astype(int))
             except:
                 pass
        return preds

    def save(self, path: str):
        with open(path, 'wb') as f:
            pickle.dump(self, f)
            
    @staticmethod
    def load(path: str):
        with open(path, 'rb') as f:
            return pickle.load(f)
