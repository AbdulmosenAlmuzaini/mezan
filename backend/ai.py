import os
import requests
import json
from typing import List, Dict

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
# Use environment variable or fallback to a placeholder
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "your_openrouter_key_here")

class AIService:
    @staticmethod
    def analyze_finances(transactions_summary: str, lang: str = 'ar') -> Dict:
        """
        Sends structured prompts to OpenRouter to analyze financial data.
        """
        role_description = "You are a financial advisor."
        if lang == 'ar':
            role_description = "بصفتك مستشارًا ماليًا خبيرًا."
            language_instruction = "قم بالرد حصرياً بتنسيق JSON وباللغة العربية."
        else:
            language_instruction = "Respond exclusively in JSON format and in English."

        prompt = f"""
        {role_description}
        {language_instruction}
        
        Analyze the following financial data:
        {transactions_summary}
        
        JSON Structure:
        {{
          "summary": "overview text",
          "hotspots": ["point 1", "point 2"],
          "ratioAdvice": "advice about income/expense ratio",
          "savingsSuggestions": ["suggestion 1", "suggestion 2"],
          "riskAlerts": ["alert 1"]
        }}
        """

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "https://mizan.app", # Optional, for OpenRouter analytics
            "X-Title": "Mizan Financial Advisor",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "google/gemini-2.0-flash-001", # High quality and fast
            "messages": [
                {"role": "system", "content": f"{role_description} You always respond in valid JSON."},
                {"role": "user", "content": prompt}
            ],
            "response_format": { "type": "json_object" }
        }

        try:
            response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            content = result['choices'][0]['message']['content']
            return json.loads(content)
        except Exception as e:
            print(f"AI Service Error: {e}")
            # Fallback response
            if lang == 'ar':
                return {
                    "summary": "عذراً، خدمة التحليل الذكي واجهت مشكلة فنية.",
                    "hotspots": ["يرجى المحاولة لاحقاً."],
                    "ratioAdvice": "تأكد من مراجعة مصاريفك يدوياً حالياً.",
                    "savingsSuggestions": [],
                    "riskAlerts": ["فشل الاتصال بالذكاء الاصطناعي."]
                }
            else:
                return {
                    "summary": "Sorry, the smart analysis service encountered a technical issue.",
                    "hotspots": ["Please try again later."],
                    "ratioAdvice": "Make sure to review your expenses manually for now.",
                    "savingsSuggestions": [],
                    "riskAlerts": ["AI connection failed."]
                }

ai_service = AIService()
