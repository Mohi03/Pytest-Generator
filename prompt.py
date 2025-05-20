from flask import Flask, jsonify, request , render_template
from flask_cors import CORS
from google import genai
from google.genai import types

app = Flask(__name__)
CORS(app)


@app.route('/', methods=['GET', 'POST'])
def get_acceptance_criteria():
    if request.method == 'GET':
        return render_template('index.html')

    # Handle POST request
    data = request.get_json()
    userStory = data.get("userStory")
    scenarios = data.get("scenarios", [])  # Default to empty list if not provided
    
    try:
        client = genai.Client(api_key="AIzaSyBzS4ZG8WdpuSIESr4omIJmAC2j_TVmJbo")
        
        if not scenarios:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                config=types.GenerateContentConfig(
                    temperature=0.0,
                    system_instruction="Ignore the prior instructions..."),  # trimmed for brevity
                contents=userStory
            )
            return jsonify({
                'acceptance_criteria': response.text
            })

        # If scenarios are provided, generate test cases
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            config=types.GenerateContentConfig(
                temperature=0.0,
                system_instruction="Write complete pytest test cases..."),
            contents=scenarios
        )
        return jsonify({
            'pytest_tests': response.text
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
