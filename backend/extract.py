# import cv2
# import pytesseract
# import re
# import numpy as np

# # ✅ Set Tesseract Path (For Windows Users)
# TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
# pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

# def preprocess_image(image_path):
#     """Preprocess the image to improve OCR accuracy."""
#     image = cv2.imread(image_path)

#     # ✅ Convert to Grayscale
#     gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

#     # ✅ Apply Otsu’s Thresholding
#     _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

#     # ✅ Use Morphological Transformations
#     kernel = np.ones((2,2), np.uint8)
#     processed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

#     # ✅ Resize for better OCR readability
#     processed = cv2.resize(processed, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_CUBIC)

#     return processed

# def extract_text(image):
#     """Extract text from image using Tesseract OCR."""
#     custom_config = r'--oem 3 --psm 6'
#     extracted_text = pytesseract.image_to_string(image, config=custom_config)
#     return extracted_text

# def extract_details(text):
#     """Extract student details and marks from the extracted text."""
    
#     # ✅ Extract Student Name
#     student_match = re.search(r'This is to certify that\s*\|?\s*([A-Z\s]+)', text, re.IGNORECASE)
#     student_name = student_match.group(1).strip() if student_match else "Not Found"

#     # ✅ Extract Roll Number (Fixing Display Issue)
#     roll_no_match = re.search(r'Roll\s*No[:\-]?\s*(\d+)', text, re.IGNORECASE)
#     roll_number = roll_no_match.group(1) if roll_no_match else "Not Found"

#     # ✅ Extract Mother's Name
#     mother_match = re.search(r"Mother's Name\s*[:\-]?\s*([A-Z\s]+)", text, re.IGNORECASE)
#     mother_name = mother_match.group(1).strip() if mother_match else "Not Found"

#     # ✅ Extract Father's Name (Fixing unwanted text issue)
#     father_match = re.search(r"Father's\s*/\s*Guardian's Name\s*[:\-]?\s*([A-Z\s]+)", text, re.IGNORECASE)
#     father_name = father_match.group(1).strip() if father_match else "Not Found"
#     father_name = re.sub(r"[^A-Z\s]", "", father_name)  # Removing unwanted characters

#     # ✅ Extract Date of Birth
#     dob_match = re.search(r'Date of Birth\s*(\d{2}/\d{2}/\d{4})', text, re.IGNORECASE)
#     date_of_birth = dob_match.group(1) if dob_match else "Not Found"

#     # ✅ Extract School Name
#     school_match = re.search(r'School\s*[:\-]?\s*([A-Z\s\.\'\-]+)', text)
#     school_name = school_match.group(1).strip() if school_match else "Not Found"

#     # ✅ Extract Subjects & Marks
#     marks_data = {}
#     subjects_pattern = re.findall(r'(\d{3})\s([A-Z\s\-&]+)\s+(\d{2,3})\s+\d{2,3}\s+(\d{2,3})', text)

#     for match in subjects_pattern:
#         subject_code, subject_name, theory_marks, total_marks = match
#         marks_data[subject_name.strip()] = int(total_marks)  # Store marks with subject name

#     # 🛠 **Fix Missing English Subject**
#     if "ENGLISH LNG & LIT." not in marks_data:
#         english_match = re.search(r'ENGLISH\s+LNG\s*&\s*LIT\.\s+(\d{2,3})\s+\d{2,3}\s+(\d{2,3})', text)
#         if english_match:
#             marks_data["ENGLISH LNG & LIT."] = int(english_match.group(2))

#     return student_name, roll_number, mother_name, father_name, date_of_birth, school_name, marks_data

# def main(image_path):
#     """Main function to extract information from marksheet."""
#     print("📜 Processing image...")

#     # ✅ Preprocess Image
#     processed_image = preprocess_image(image_path)

#     # ✅ Extract Text
#     extracted_text = extract_text(processed_image)
#     print("\n📝 Extracted Text:\n", extracted_text)

#     # ✅ Extract Details
#     student_name, roll_number, mother_name, father_name, date_of_birth, school_name, marks_data = extract_details(extracted_text)

#     # ✅ Print Extracted Details
#     print("\n📜 Extracted Details:")
#     print(f"👤 Student Name: {student_name}")
#     print(f"🎓 School/College Name: {school_name}")
    
#     print(f"👩 Mother's Name: {mother_name}")
#     print(f"👨 Father's Name: {father_name}")
#     print(f"📅 Date of Birth: {date_of_birth}")
#     print("📊 Marks:")
#     if marks_data:
#         for subject, marks in marks_data.items():
#             print(f"   - {subject}: {marks}")
#     else:
#         print("   ❌ Marks Not Found")

# if __name__ == "__main__":
#     image_path = ""  # Replace with your actual file
#     main(image_path)


import cv2
import pytesseract
import re
import numpy as np
import json
import sys  # ✅ For command-line arguments

# ✅ Set Tesseract Path (For Windows Users)
TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

def preprocess_image(image_path):
    """Preprocess the image to improve OCR accuracy."""
    try:
        image = cv2.imread(image_path)
        if image is None:
            return None

        # ✅ Convert to Grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # ✅ Apply Otsu’s Thresholding
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # ✅ Use Morphological Transformations
        kernel = np.ones((2, 2), np.uint8)
        processed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

        # ✅ Resize for better OCR readability
        processed = cv2.resize(processed, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_CUBIC)

        return processed
    except Exception as e:
        return None

def extract_text(image):
    """Extract text from image using Tesseract OCR."""
    if image is None:
        return ""
    custom_config = r'--oem 3 --psm 6'
    return pytesseract.image_to_string(image, config=custom_config)

def extract_details(text):
    """Extract student details and marks from the extracted text."""
    
    student_name = re.search(r'This is to certify that\s*\|?\s*([A-Z\s]+)', text, re.IGNORECASE)
    roll_number = re.search(r'Roll\s*No[:\-]?\s*(\d+)', text, re.IGNORECASE)
    mother_name = re.search(r"Mother's Name\s*[:\-]?\s*([A-Z\s]+)", text, re.IGNORECASE)
    father_name = re.search(r"Father's\s*/\s*Guardian's Name\s*[:\-]?\s*([A-Z\s]+)", text, re.IGNORECASE)
    date_of_birth = re.search(r'Date of Birth\s*(\d{2}/\d{2}/\d{4})', text, re.IGNORECASE)
    school_name = re.search(r'School\s*[:\-]?\s*([A-Z\s\.\'\-]+)', text)

    # ✅ Extract Subjects & Marks
    marks_data = {}
    subjects_pattern = re.findall(r'(\d{3})\s([A-Z\s\-&]+)\s+(\d{2,3})\s+\d{2,3}\s+(\d{2,3})', text)
    for match in subjects_pattern:
        subject_code, subject_name, theory_marks, total_marks = match
        marks_data[subject_name.strip()] = int(total_marks)


     # 🛠 **Fix Missing English Subject**
    if "ENGLISH LNG & LIT." not in marks_data:
        english_match = re.search(r'ENGLISH\s+LNG\s*&\s*LIT\.\s+(\d{2,3})\s+\d{2,3}\s+(\d{2,3})', text)
        if english_match:
            marks_data["ENGLISH LNG & LIT."] = int(english_match.group(2))
            
    return {
        "student_name": student_name.group(1).strip() if student_name else "Not Found",
        "roll_number": roll_number.group(1) if roll_number else "Not Found",
        "mother_name": mother_name.group(1).strip() if mother_name else "Not Found",
        "father_name": father_name.group(1).strip() if father_name else "Not Found",
        "date_of_birth": date_of_birth.group(1) if date_of_birth else "Not Found",
        "school_name": school_name.group(1).strip() if school_name else "Not Found",
        "marks": marks_data
    }

def analyze_marksheet(image_path):
    """Main function to extract information from marksheet."""
    processed_image = preprocess_image(image_path)
    extracted_text = extract_text(processed_image)
    return extract_details(extracted_text)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
    else:
        image_path = sys.argv[1]
        result = analyze_marksheet(image_path)
        print(json.dumps(result))  # ✅ Output JSON for server.js
