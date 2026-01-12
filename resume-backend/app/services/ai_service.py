
import os
import google.generativeai as genai
from groq import Groq
from app.config import settings
import traceback

class AIService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIService, cls).__new__(cls)
            cls._instance.initialize()
        return cls._instance

    def initialize(self):
        """Initialize both AI clients"""
        self.groq_client = None
        self.gemini_configured = False
        
        # Initialize Groq
        if settings.GROQ_API_KEY:
            try:
                self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
                print("✅ Groq Client Initialized")
            except Exception as e:
                print(f"⚠️ Failed to initialize Groq: {e}")
        
        # Initialize Gemini
        if settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.gemini_configured = True
                print("✅ Gemini API Configured")
            except Exception as e:
                print(f"⚠️ Failed to configure Gemini: {e}")

    async def generate_content(self, prompt: str, system_instruction: str = None) -> str:
        """
        Generate content using Groq first, falling back to Gemini.
        Returns the generated text string.
        """
        # 1. Try Groq First
        if self.groq_client:
            try:
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                
                messages.append({"role": "user", "content": prompt})
                
                completion = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=4096,
                    top_p=1,
                    stream=False,
                    stop=None,
                )
                
                result = completion.choices[0].message.content
                if result:
                    return result

            except Exception as e:
                print(f"❌ Groq Error (Falling back to Gemini): {e}")
        
        # 2. Fallback to Gemini
        if self.gemini_configured:
            try:
                model = genai.GenerativeModel(settings.GEMINI_MODEL)
                
                # Gemini doesn't have system role in `generate_content` easily without beta API or chat
                # We prepend system instruction to prompt for simplicity
                full_prompt = prompt
                if system_instruction:
                    full_prompt = f"System Instruction: {system_instruction}\n\nUser Query: {prompt}"
                
                response = model.generate_content(full_prompt)
                return response.text

            except Exception as e:
                print(f"❌ Gemini Error: {e}")
                # traceback.print_exc()
                raise Exception("Both AI services failed")
        
        raise Exception("No AI services configured")

    async def chat_with_history(self, messages: list, system_instruction: str = None) -> str:
        """
        Chat with history support.
        messages = [{"role": "user", "content": "hi"}, {"role": "assistant", "content": "hello"}]
        """
        # 1. Try Groq
        if self.groq_client:
            try:
                groq_messages = []
                if system_instruction:
                    groq_messages.append({"role": "system", "content": system_instruction})
                
                groq_messages.extend(messages)
                
                completion = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=groq_messages,
                    temperature=0.7,
                    max_tokens=4096
                )
                return completion.choices[0].message.content
            except Exception as e:
                print(f"❌ Groq Chat Error (Falling back to Gemini): {e}")

        # 2. Fallback to Gemini
        if self.gemini_configured:
            try:
                # Convert messages to Gemini history format
                # Gemini history: [{"role": "user", "parts": ["..."]}, {"role": "model", "parts": ["..."]}]
                gemini_history = []
                last_user_message = ""
                
                for msg in messages:
                    if msg["role"] == "user":
                        last_user_message = msg["content"]
                        # We don't add the LAST user message to history for start_chat, 
                        # we send it in send_message.
                        # BUT wait, start_chat takes history of PREVIOUS turns.
                        pass 
                    
                # Creating history properly
                # We need to separate the LAST user message from the history for send_message
                
                if messages and messages[-1]["role"] == "user":
                    current_query = messages[-1]["content"]
                    past_messages = messages[:-1]
                else:
                    current_query = ""
                    past_messages = messages
                
                formatted_history = []
                for msg in past_messages:
                     role = "user" if msg["role"] == "user" else "model"
                     formatted_history.append({"role": role, "parts": [msg["content"]]})

                model = genai.GenerativeModel(settings.GEMINI_MODEL)
                
                # Inject system instruction if possible or prepend
                if system_instruction:
                    # Best attempt to simulate system prompt in Gemini
                    # Only if history is empty, prepend to query?
                    # Or inject as first history item?
                    # For simplicity, prepend to the query if history is short, or rely on model context
                    # Prepending to the first message if it exists
                     if formatted_history and formatted_history[0]["role"] == "user":
                         formatted_history[0]["parts"][0] = f"System: {system_instruction}\n\n{formatted_history[0]['parts'][0]}"
                     else:
                         current_query = f"System: {system_instruction}\n\n{current_query}"

                chat = model.start_chat(history=formatted_history)
                response = chat.send_message(current_query)
                return response.text

            except Exception as e:
                 print(f"❌ Gemini Chat Error: {e}")
                 raise Exception("Both AI services failed")
        
        raise Exception("No AI services configured")

ai_service = AIService()
