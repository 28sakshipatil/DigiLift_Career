# Import necessary libraries
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
import os

# Step 1: Load the Dataset with Debugging
file_path = "mbti_detailed_prediction_dataset.csv"

if os.path.exists(file_path):
    df = pd.read_csv(file_path)
    print("✅ Dataset loaded successfully!")
else:
    print(f"❌ Error: File '{file_path}' not found.")
    exit()

# Step 2: Check Available Columns
print("🔹 Available Columns:", df.columns)

# Ensure column names have no leading/trailing spaces
df.columns = df.columns.str.strip()

# **Fix Column Name Mappings**
column_mappings = {
    "Career Prediction": "Suggested_Career",
    "Emotional State": "Detected_Emotion",
    "Stream": "Recommended_Stream"
}

# Rename columns for consistency
df.rename(columns=column_mappings, inplace=True)

# Step 3: Check if Key Columns Exist Before Proceeding
required_columns = ["Suggested_Career", "Detected_Emotion", "Recommended_Stream", "Career_And_Subject_View"]
missing_columns = [col for col in required_columns if col not in df.columns]

if missing_columns:
    print(f"❌ Error: Missing columns in dataset: {missing_columns}")
    exit()

# Step 4: Check Data Distribution
plt.figure(figsize=(12, 6))
df["Suggested_Career"].value_counts().plot(kind="bar")
plt.title("Career Distribution")
plt.xlabel("Career")
plt.ylabel("Frequency")
plt.show()

# Step 5: Convert User Response into Numerical Features (TF-IDF)
vectorizer = TfidfVectorizer(max_features=2000, ngram_range=(1, 2))
X = vectorizer.fit_transform(df["Career_And_Subject_View"])

# Step 6: Define Target Variables
y_career = df["Suggested_Career"]
y_emotion = df["Detected_Emotion"]
y_stream = df["Recommended_Stream"]

# Step 7: Split Data for Training and Testing
X_train, X_test, y_train_career, y_test_career = train_test_split(X, y_career, test_size=0.2, random_state=42)
X_train, X_test, y_train_emotion, y_test_emotion = train_test_split(X, y_emotion, test_size=0.2, random_state=42)
X_train, X_test, y_train_stream, y_test_stream = train_test_split(X, y_stream, test_size=0.2, random_state=42)

# Step 8: Train Models with Hyperparameter Tuning (Random Forest)
param_grid = {
    'n_estimators': [100, 300, 500],
    'max_depth': [10, 20, None],
    'min_samples_split': [2, 5, 10]
}

grid_search = GridSearchCV(RandomForestClassifier(random_state=42), param_grid, cv=3, verbose=1, n_jobs=-1)
grid_search.fit(X_train, y_train_career)
best_rf_career = grid_search.best_estimator_

# Train Additional Models (Logistic Regression, Gradient Boosting)
logistic_career = LogisticRegression(max_iter=1000)
logistic_career.fit(X_train, y_train_career)

gb_career = GradientBoostingClassifier(n_estimators=200, learning_rate=0.1)
gb_career.fit(X_train, y_train_career)

# Step 9: Evaluate Model Accuracy
models = {
    "Random Forest": best_rf_career,
    "Logistic Regression": logistic_career,
    "Gradient Boosting": gb_career
}

for name, model in models.items():
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test_career, predictions)
    print(f"✅ {name} Career Prediction Accuracy: {accuracy * 100:.2f}%")

# Train & Evaluate Emotion and Stream Models
rf_emotion = RandomForestClassifier(n_estimators=300, random_state=42)
rf_emotion.fit(X_train, y_train_emotion)

rf_stream = RandomForestClassifier(n_estimators=300, random_state=42)
rf_stream.fit(X_train, y_train_stream)

emotion_pred = rf_emotion.predict(X_test)
stream_pred = rf_stream.predict(X_test)

emotion_acc = accuracy_score(y_test_emotion, emotion_pred)
stream_acc = accuracy_score(y_test_stream, stream_pred)

print(f"✅ Emotional State Prediction Accuracy: {emotion_acc * 100:.2f}%")
print(f"✅ Stream Prediction Accuracy: {stream_acc * 100:.2f}%")

# Step 10: Function to Predict for a New User Input
def predict_user_input(user_text):
    user_tfidf = vectorizer.transform([user_text])
    
    predicted_career_rf = best_rf_career.predict(user_tfidf)[0]
    predicted_career_log = logistic_career.predict(user_tfidf)[0]
    predicted_career_gb = gb_career.predict(user_tfidf)[0]
    
    predicted_emotion = rf_emotion.predict(user_tfidf)[0]
    predicted_stream = rf_stream.predict(user_tfidf)[0]

    print("\n🔹 Predicted Results for Your Input:")
    print(f"✅ Random Forest Career Prediction: {predicted_career_rf}")
    # print(f"✅ Logistic Regression Career Prediction: {predicted_career_log}")
    print(f"✅ Gradient Boosting Career Prediction: {predicted_career_gb}")
    print(f"✅ Emotional State: {predicted_emotion}")
    print(f"✅ Recommended Stream: {predicted_stream}")

# Example Prediction
user_input = input("\n🔹 Enter your personality traits and interests: ")
predict_user_input(user_input)
