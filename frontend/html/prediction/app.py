from flask import Flask, jsonify, request
import joblib
import pandas as pd
from flask_cors import CORS, cross_origin

app = Flask(__name__)
CORS(app)  # Allow all origins

# Load trained model and preprocessors
model = joblib.load("student_stream_model.pkl")
label_encoder_stream = joblib.load("label_encoder_stream.pkl")
scaler = joblib.load("scaler.pkl")

# Question Banks
ABILITY_TO_THINK_QUESTIONS = [
    {"question": "What comes next in the series? 2, 4, 8, 16, ?", "options": ["32", "24", "48", "64"], "answer": "32"},
    {"question": "If A = 1, B = 2, ..., Z = 26, what is the sum of letters in 'ACE'?", "options": ["9", "11", "14", "12"], "answer": "9"},
    {"question": "Find the odd one out: Apple, Banana, Mango, Carrot", "options": ["Apple", "Banana", "Mango", "Carrot"], "answer": "Carrot"},
    {"question": "If 3 + 5 = 16, 4 + 6 = 25, then 5 + 7 = ?", "options": ["30", "36", "40", "50"], "answer": "36"},
    {"question": "How many triangles are there in a pentagram?", "options": ["5", "10", "15", "20"], "answer": "10"},
    {"question": "What is 2^6?", "options": ["64", "32", "16", "128"], "answer": "64"},
    {"question": "If 7 people shake hands with each other once, how many handshakes occur?", "options": ["21", "28", "14", "35"], "answer": "21"},
    {"question": "What is the next prime number after 11?", "options": ["12", "13", "15", "17"], "answer": "13"},
    {"question": "Complete the analogy: Book is to Reading as Fork is to ?", "options": ["Knife", "Eating", "Cooking", "Writing"], "answer": "Eating"},
    {"question": "A clock shows 3:15. What is the angle between the hour and minute hands?", "options": ["7.5 degrees", "15 degrees", "30 degrees", "37.5 degrees"], "answer": "7.5 degrees"}
]

LOGICAL_REASONING_QUESTIONS = [
    {"question": "What is the missing number? 1, 4, 9, 16, ?", "options": ["20", "24", "25", "30"], "answer": "25"},
    {"question": "If John's mother is Mary, and Mary's father is Robert, what is Robert to John?", "options": ["Uncle", "Father", "Grandfather", "Brother"], "answer": "Grandfather"},
    {"question": "Which one does not belong? Square, Triangle, Rectangle, Circle", "options": ["Square", "Triangle", "Rectangle", "Circle"], "answer": "Circle"},
    {"question": "Find the missing letter: A, C, E, G, ?", "options": ["H", "I", "J", "K"], "answer": "I"},
    {"question": "What comes next? 2, 6, 12, 20, ?", "options": ["26", "30", "32", "42"], "answer": "30"},
    {"question": "Which number is missing? 3, 6, 11, 18, ?", "options": ["27", "28", "29", "30"], "answer": "29"},
    {"question": "If a triangle has three sides, how many sides does a hexagon have?", "options": ["4", "5", "6", "7"], "answer": "6"},
    {"question": "Which shape has the least number of sides?", "options": ["Hexagon", "Triangle", "Pentagon", "Square"], "answer": "Triangle"},
    {"question": "Complete the sequence: Monday, Tuesday, Wednesday, ?", "options": ["Friday", "Sunday", "Thursday", "Saturday"], "answer": "Thursday"},
    {"question": "How many legs do 3 cows and 2 chickens have together?", "options": ["14", "16", "18", "20"], "answer": "16"}
]

@app.route("/questions", methods=["GET"])
def get_questions():
    questions = ABILITY_TO_THINK_QUESTIONS[:10] + LOGICAL_REASONING_QUESTIONS[:10]
    return jsonify(questions)

@app.route("/submit_test", methods=["POST"])
def submit_test():
    data = request.get_json()
    answers = data["answers"]

    ability_score = sum(1 for i in range(10) if answers[i] == ABILITY_TO_THINK_QUESTIONS[i]["answer"])
    reasoning_score = sum(1 for i in range(10, 20) if answers[i] == LOGICAL_REASONING_QUESTIONS[i - 10]["answer"])

    return jsonify({"Ability_to_Think": ability_score, "Logical_Reasoning": reasoning_score})

@app.route("/predict", methods=["POST"])
@cross_origin()
def predict_stream():
    data = request.get_json()

    english = float(data["English_Marks"])
    math = float(data["Math_Marks"])
    science = float(data["Science_Marks"])
    ability_to_think = int(data["Ability_to_Think"])
    logical_reasoning = int(data["Logical_Reasoning"])

    input_data = pd.DataFrame([[english, math, science, ability_to_think, logical_reasoning]], 
        columns=["English_Marks", "Math_Marks", "Science_Marks", "Ability_to_Think", "Logical_Reasoning"])

    # Scale features
    input_data[["English_Marks", "Math_Marks", "Science_Marks", "Ability_to_Think", "Logical_Reasoning"]] = scaler.transform(input_data)

    prediction = model.predict(input_data)
    predicted_stream = label_encoder_stream.inverse_transform(prediction)[0]

    return jsonify({"Recommended_Stream": predicted_stream})

if __name__ == "__main__":
    app.run(debug=True)