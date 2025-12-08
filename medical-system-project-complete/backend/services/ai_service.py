import logging
from typing import Dict, List, Optional

import httpx

from config import settings

logger = logging.getLogger(__name__)


class AIService:
    """
    Service for AI chat functionality using OpenAI API (gpt-3.5-turbo)
    """

    def __init__(self):
        self.openai_api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL or "gpt-3.5-turbo"
        self.base_url = "https://api.openai.com/v1"

        # System prompt for medical assistant
        self.system_prompt = """Вы - медицинский AI ассистент в системе Medical System.

Ваша роль:
- Помогать пользователям с общими медицинскими вопросами
- Предоставлять информацию о симптомах и возможных причинах
- Давать рекомендации по здоровому образу жизни
- Помогать понять медицинскую терминологию

ВАЖНЫЕ ОГРАНИЧЕНИЯ:
- НЕ ставьте окончательные диагнозы
- НЕ назначайте лечение или лекарства
- ВСЕГДА рекомендуйте обратиться к врачу при серьёзных симптомах
- НЕ заменяйте профессиональную медицинскую консультацию
- Будьте осторожны с советами, которые могут навредить здоровью

Стиль общения:
- Профессиональный и вежливый
- Понятный для обычных людей (без излишней медицинской терминологии)
- Эмпатичный и поддерживающий
- Отвечайте на русском языке

При серьёзных симптомах (боль в груди, затруднённое дыхание, сильное кровотечение и т.д.) 
немедленно рекомендуйте обратиться к врачу или вызвать скорую помощь."""

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        user_context: Optional[Dict] = None,
    ) -> Dict:
        """
        Send chat completion request to OpenAI Chat Completions API

        Args:
            messages: List of message dicts with 'role' and 'content'
            user_context: Optional user context (role, name, etc.)

        Returns:
            Dict with response content, model, and token usage
        """

        if not self.openai_api_key:
            raise Exception("OPENAI_API_KEY not configured in settings")

        # Add system message
        full_messages = [{"role": "system", "content": self.system_prompt}] + messages

        # Add user context if provided
        if user_context:
            context_msg = (
                f"\nКонтекст пользователя: {user_context.get('role', 'пациент')}"
            )
            if user_context.get("name"):
                context_msg += f", имя: {user_context['name']}"
            full_messages[0]["content"] += context_msg

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openai_api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": full_messages,
            "temperature": 0.7,
            "max_tokens": 800,
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()

            # Extract assistant content
            assistant_message = ""
            if "choices" in data and len(data["choices"]) > 0:
                assistant_message = data["choices"][0]["message"]["content"].strip()

            # Token usage if available
            tokens_used = None
            if "usage" in data:
                tokens_used = data["usage"].get("total_tokens")

            logger.info(f"AI response generated. Model: {self.model}")

            return {
                "content": assistant_message,
                "model": self.model,
                "tokens": tokens_used,
            }

        except httpx.HTTPError as e:
            logger.error(f"Error connecting to OpenAI API: {str(e)}")
            raise Exception(f"OpenAI service error: {str(e)}")

    async def generate_session_title(self, first_message: str) -> str:
        if not self.openai_api_key:
            return (
                first_message[:47] + "..." if len(first_message) > 50 else first_message
            )

        system_prompt = (
            "Создайте короткий заголовок (максимум 50 символов) для чата на основе первого сообщения пользователя. "
            "Только заголовок, без дополнительного текста."
        )

        full_messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": first_message},
        ]

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openai_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": full_messages,
            "temperature": 0.5,
            "max_tokens": 60,
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()

            title = ""
            if "choices" in data and len(data["choices"]) > 0:
                title = data["choices"][0]["message"]["content"].strip()

            if len(title) > 50:
                title = title[:47] + "..."

            return title

        except httpx.HTTPError as e:
            logger.error(f"Error generating session title with OpenAI: {str(e)}")
            return (
                first_message[:47] + "..." if len(first_message) > 50 else first_message
            )


# Singleton instance
ai_service = AIService()
