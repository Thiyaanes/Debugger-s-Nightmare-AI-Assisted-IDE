import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS

# Initialize the Flask app
app = Flask(__name__)
# Enable Cross-Origin Resource Sharing (CORS) to allow requests from the frontend
CORS(app)

@app.route('/execute', methods=['POST'])
def execute_code():
    data = request.get_json()
    code = data.get('code', '')

    if not code:
        return jsonify({'error': 'No code provided.'}), 400

    try:
        # Use subprocess.run to execute the code safely in a new process
        # A timeout is crucial to prevent infinite loops from hanging the server
        result = subprocess.run(
            ['python', '-c', code],
            capture_output=True,
            text=True,
            timeout=5  # 5-second timeout
        )

        # If the process returned an error code, send back the standard error
        if result.returncode != 0:
            return jsonify({'output': result.stderr})
        
        # Otherwise, send back the standard output
        return jsonify({'output': result.stdout})

    except subprocess.TimeoutExpired:
        return jsonify({'output': 'Execution timed out! (Possible infinite loop)'}), 200
    except Exception as e:
        return jsonify({'output': f'An unexpected server error occurred: {str(e)}'}), 500
from dotenv import load_dotenv
import os
import google.generativeai as genai

load_dotenv()  # loads .env file

API_KEY = os.getenv("GENAI_API_KEY")
genai.configure(api_key=API_KEY)


@app.route('/gemini', methods=['POST'])
def gemini_help():
    try:
        data = request.get_json(force=True)

        prompt = data.get("prompt", "")
        code = data.get("code", "")
        error = data.get("error", "")

        model = genai.GenerativeModel("gemini-pro")

        response = model.generate_content(
            f"""
You are a sarcastic debugging assistant.

Error:
{error}

User Code:
{code}

Task:
{prompt}
"""
        )

        return jsonify({"reply": response.text})

    except Exception as e:
        return jsonify({
            "reply": "❌ Gemini server error",
            "details": str(e)
        }), 500


if __name__ == '__main__':
    # This must be running for the frontend to connect to it
    app.run(port=5000)