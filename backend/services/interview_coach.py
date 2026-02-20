import json
from openai import AsyncOpenAI
from config import OPENAI_API_KEY

client = AsyncOpenAI(api_key=OPENAI_API_KEY)


async def generate_interview_prep(
    job_title: str,
    job_description: str,
    resume_summary: str = "",
) -> list[dict]:
    """
    Generate role-specific interview questions with tips.
    Returns a list of InterviewQuestion dicts.
    """
    context = f"Job Title: {job_title}\n\nJob Description:\n{job_description[:2000]}"
    if resume_summary:
        context += f"\n\nCandidate Summary: {resume_summary}"

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert interview coach. Generate tailored interview questions for a specific role.\n\n"
                    "Return JSON with a 'questions' array. Each question must have:\n"
                    '- "category": one of "Technical", "Behavioral", "Culture Fit"\n'
                    '- "question": the interview question\n'
                    '- "why_asked": 1 sentence explaining why interviewers ask this\n'
                    '- "tip": 1-2 sentence advice on how to answer well\n\n'
                    "Generate 3-4 Technical, 2-3 Behavioral, and 2 Culture Fit questions. "
                    "Make them specific to this role, not generic."
                ),
            },
            {"role": "user", "content": context},
        ],
    )
    data = json.loads(response.choices[0].message.content)
    return data.get("questions", [])
