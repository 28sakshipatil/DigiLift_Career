import joblib
import pandas as pd

# Load models and encoders
pipeline_mbti = joblib.load("mbti_model.pkl")
pipeline_emotion = joblib.load("emotion_model.pkl")
pipeline_career = joblib.load("career_model.pkl")
pipeline_stream = joblib.load("stream_model.pkl")

le_mbti = joblib.load("le_mbti.pkl")
le_emotion = joblib.load("le_emotion.pkl")
le_career = joblib.load("le_career.pkl")
le_stream = joblib.load("le_stream.pkl")

# Load MBTI descriptions from dataset
df = pd.read_csv("mbti_detailed_prediction_dataset.csv")
mbti_descriptions = dict(zip(df["MBTI_Type"], df["MBTI_Description"]))

# Function to predict
def predict_user_input(user_text):
    mbti_pred = le_mbti.inverse_transform(pipeline_mbti.predict([user_text]))[0]
    emotion_pred = le_emotion.inverse_transform(pipeline_emotion.predict([user_text]))[0]
    career_pred = le_career.inverse_transform(pipeline_career.predict([user_text]))[0]
    stream_pred = le_stream.inverse_transform(pipeline_stream.predict([user_text]))[0]
    mbti_description = mbti_descriptions.get(mbti_pred, "No description available.")

    print(f"🧠 Detected Personality (MBTI): {mbti_pred} - {mbti_description}")
    print(f"😊 Detected Emotion: {emotion_pred}")
    print(f"💼 Suggested Career: {career_pred}")
    print(f"📚 Recommended Stream: {stream_pred}")

# Get user input
user_input = input(" I love helping people and I'm fascinated by the human body. I enjoy studying biology and chemistry, and I dream of becoming a doctor one day. ")
predict_user_input(user_input)
