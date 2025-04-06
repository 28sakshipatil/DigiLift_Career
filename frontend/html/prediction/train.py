# Import necessary libraries
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler, PolynomialFeatures
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_score, recall_score
from sklearn.model_selection import RandomizedSearchCV
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

# Feature Engineering: Add new features
df['Total_Marks'] = df['English_Marks'] + df['Science_Marks'] + df['Math_Marks']
df['Avg_Marks'] = df['Total_Marks'] / 3
df['Marks_Squared'] = df['Math_Marks']**2 + df['Science_Marks']**2 + df['English_Marks']**2

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

# Hyperparameter tuning for RandomForestClassifier
param_dist = {
    'n_estimators': [200, 300, 400, 500],
    'max_depth': [10, 20, 30, None],
    'min_samples_split': [2, 5, 10, 15],
    'min_samples_leaf': [1, 2, 4, 8],
    'max_features': ['sqrt', 'log2'],
    'bootstrap': [True, False],
    'class_weight': ['balanced', 'balanced_subsample']  # Handle class imbalance
}

rf = RandomForestClassifier(random_state=42)
random_search = RandomizedSearchCV(
    rf, param_distributions=param_dist, n_iter=30, cv=5, scoring='accuracy', random_state=42, n_jobs=-1
)
random_search.fit(X_train, y_train)

# Get the best Random Forest model
best_rf = random_search.best_estimator_

# Gradient Boosting Classifier for better generalization
gb = GradientBoostingClassifier(n_estimators=200, learning_rate=0.1, max_depth=5, random_state=42)

# Combine models using Voting Classifier
ensemble_model = VotingClassifier(
    estimators=[('rf', best_rf), ('gb', gb)],
    voting='soft'  # Soft voting gives better probabilities
)

# Train the ensemble model
ensemble_model.fit(X_train, y_train)

# Evaluate the model
y_pred = ensemble_model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average='weighted')
recall = recall_score(y_test, y_pred, average='weighted')

# Print evaluation metrics
print(f"Enhanced Model Accuracy: {accuracy * 100:.2f}%")
print(f"Precision: {precision * 100:.2f}%")
print(f"Recall: {recall * 100:.2f}%\n")

print("Classification Report:")
print(classification_report(y_test, y_pred))

# Save the model and preprocessors
# joblib.dump(ensemble_model, "student_stream_ensemble_model.pkl")
# joblib.dump(label_encoder_stream, "label_encoder_stream.pkl")
# joblib.dump(scaler, "scaler.pkl")

# print("Enhanced model and preprocessors saved successfully!")
