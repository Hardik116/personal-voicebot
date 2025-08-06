from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import datetime
import re
import google.generativeai as genai

# Create Flask app
app = Flask(__name__)
CORS(app)

# Load Gemini API key from environment variable
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Read prompt from file
try:
    with open("prompt.txt", "r", encoding="utf-8") as file:
        prompt_text = file.read()
except FileNotFoundError:
    prompt_text = ""
    print("[Warning] prompt.txt not found!")

CHARACTER_SKETCH = prompt_text


def sanitize_input(text):
    """Remove non-printable characters."""
    return re.sub(r'[^\x20-\x7E]', '', text)


def get_gemini_sdk_response(prompt):
    """Generate response using Gemini SDK."""
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini SDK Error] {e}")
        return "Sorry, something went wrong. Please try again later."


@app.route('/')
def index():
    return render_template('index.html')  # Ensure templates/index.html exists


@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    query = data.get('query', '').strip()

    if not query:
        return jsonify({'error': 'Query is required'}), 400
    if not GEMINI_API_KEY:
        return jsonify({'error': 'Gemini API key not configured'}), 500

    prompt = CHARACTER_SKETCH.replace("[USER_INPUT]", query)
    sanitized_prompt = sanitize_input(prompt)
    response_text = get_gemini_sdk_response(sanitized_prompt)

    return jsonify({
        'response': response_text,
        'timestamp': datetime.datetime.now().isoformat()
    })


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'timestamp': datetime.datetime.now().isoformat()})


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


# Ensure folders exist
os.makedirs('templates', exist_ok=True)
os.makedirs('static', exist_ok=True)

# Run locally only if executed directly
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
