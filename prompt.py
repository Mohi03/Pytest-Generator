from flask import Flask, jsonify, request 
from flask_cors import CORS
from google import genai
from google.genai import types

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def home():
    return " API is running. Use POST on /generate"


@app.route('/generate', methods=['POST'])
def get_acceptance_criteria():

    data = request.get_json()
    userStory = data.get("userStory")
    scenarios = data.get("scenarios", [])  # Default to empty list if not provided
    
    return jsonify({
        'acceptance_criteria': f'Dummy acceptance criteria for: {userStory}',
        'pytest_tests': 'def test_dummy(): assert True'
    })
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
