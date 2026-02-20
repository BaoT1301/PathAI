import json
from openai import AsyncOpenAI
from config import OPENAI_API_KEY

client = AsyncOpenAI(api_key=OPENAI_API_KEY)


async def analyze_skill_gap(
    job_description: str,
    candidate_skills: list[str],
) -> dict:
    """
    Compare candidate skills vs job requirements.
    Returns matching_skills, missing_skills, gap_score (0-1, lower = bigger gap).
    """
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a skill gap analyzer. Given a job description and candidate skills, "
                    "identify the required skills for the role and compare against the candidate's skills.\n\n"
                    "Return JSON with:\n"
                    '- "required_skills": list of key skills the job requires (max 10, concise labels)\n'
                    '- "matching_skills": candidate skills that match job requirements\n'
                    '- "missing_skills": important skills the job requires that the candidate lacks (max 6)\n'
                    '- "gap_score": float 0.0-1.0 where 0.0 = perfect match, 1.0 = no match\n\n'
                    "Be concise with skill names (e.g., \"Python\", \"React\", \"AWS\", \"SQL\")."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Job Description:\n{job_description[:2000]}\n\n"
                    f"Candidate Skills: {', '.join(candidate_skills)}"
                ),
            },
        ],
    )
    data = json.loads(response.choices[0].message.content)
    return {
        "matching_skills": data.get("matching_skills", []),
        "missing_skills": data.get("missing_skills", []),
        "gap_score": float(data.get("gap_score", 0.5)),
    }
