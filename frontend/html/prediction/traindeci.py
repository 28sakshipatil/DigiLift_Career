import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, classification_report, precision_score, recall_score, confusion_matrix
from sklearn.model_selection import GridSearchCV
import joblib

# Load Data
file_path = "dataten.csv"
df = pd.read_csv(file_path)

# Drop rows with missing target values
df.dropna(subset=['Recommended_Stream'], inplace=True)

# Convert Marks columns to numeric
for col in ['English_Marks', 'Science_Marks', 'Math_Marks']:
    df[col] = pd.to_numeric(df[col], errors='coerce')

# Fill missing values with the median
df.fillna(df.median(numeric_only=True), inplace=True)

# Encode categorical variables
label_encoder_stream = LabelEncoder()
df['Recommended_Stream'] = label_encoder_stream.fit_transform(df['Recommended_Stream'])

# Define features and target
X = df.drop(columns=['Recommended_Stream'])
y = df['Recommended_Stream']

# Split Data into Train and Test Sets
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Standardize numeric columns
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Hyperparameter tuning for DecisionTreeClassifier
param_grid = {
    'criterion': ['gini', 'entropy'],
    'max_depth': [5, 10, 15, 20, None],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4]
}

dt = DecisionTreeClassifier(random_state=42)
grid_search = GridSearchCV(dt, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
grid_search.fit(X_train, y_train)

# Get the best model
model = grid_search.best_estimator_

# Evaluate the model
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average='weighted')
recall = recall_score(y_test, y_pred, average='weighted')

# Print evaluation metrics
print(f"Model Accuracy: {accuracy * 100:.2f}%\n")
print(f"Precision: {precision * 100:.2f}%\n")
print(f"Recall: {recall * 100:.2f}%\n")
print("Classification Report:")
print(classification_report(y_test, y_pred))

# Save the model and preprocessors
# joblib.dump(model, "decision_tree_model.pkl")
# joblib.dump(label_encoder_stream, "label_encoder_stream.pkl")
# joblib.dump(scaler, "scaler.pkl")

# print("Model and preprocessors saved successfully!")
