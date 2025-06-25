from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from firebase_admin import credentials, initialize_app
import os

# Import our custom modules
from claude_api import process_prompt
from repair_agent import generate_response

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
service_account_path = os.path.join(script_dir, "serviceAccountKey.json")

print(f"🔍 Looking for Firebase service account key at: {service_account_path}")
print(f"📂 Current working directory: {os.getcwd()}")
print(f"📄 Script directory: {script_dir}")

# Initialize Firebase only if service account key exists
if os.path.exists(service_account_path):
    try:
        cred = credentials.Certificate(service_account_path)
        initialize_app(cred)
        print("✅ Firebase initialized successfully with service account key")
    except Exception as e:
        print(f"❌ Error initializing Firebase: {e}")
else:
    print(f"⚠️  Warning: serviceAccountKey.json not found at {service_account_path}")
    print("Firebase features will be disabled.")

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for request body
class PromptInput(BaseModel):
    prompt: str

@app.get("/ping")
def ping():
    return {"status": "pong"}

@app.post("/handle-prompt")
async def handle_prompt(input: PromptInput):
    """
    Handle a prompt by processing it through Claude API and repair agent logic.
    
    Args:
        input: PromptInput containing the user's prompt
        
    Returns:
        dict: Response with status and either response or error message
    """
    try:
        # Step 1: Send prompt to Claude API
        claude_output = process_prompt(input.prompt)
        
        if claude_output is None:
            return {
                "status": "error",
                "message": "Failed to get response from Claude API"
            }

        # Step 2: Pass Claude's output to repair agent logic
        response = generate_response(claude_output)

        return {
            "status": "success",
            "response": response
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

