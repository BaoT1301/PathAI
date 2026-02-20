import json
import pdfplumber
import docx
from io import BytesIO
from openai import AsyncOpenAI
from config import OPENAI_API_KEY
from schemas import ResumeProfile

client = AsyncOpenAI(api_key=OPENAI_API_KEY)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    with pdfplumber.open(BytesIO(file_bytes)) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages)


def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = docx.Document(BytesIO(file_bytes))
    return "\n".join(paragraph.text for paragraph in doc.paragraphs)


def extract_text(file_bytes: bytes, filename: str) -> str:
    if filename.lower().endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif filename.lower().endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {filename}")


async def parse_resume(resume_text: str) -> ResumeProfile:
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a resume parser. Extract structured information from the resume text. "
                    "Return a JSON object with these fields:\n"
                    '- "seniority": one of "intern", "junior", "mid", "senior", "lead", "director", "vp", "c-suite"\n'
                    '- "domain": the primary professional domain (e.g., "software_engineering", "marketing", '
                    '"healthcare", "finance", "data_science", "design", "operations", "sales", "hr")\n'
                    '- "skills": array of key skills (max 15)\n'
                    '- "years_experience": estimated total years of experience (integer)\n'
                    '- "summary": a 1-2 sentence professional summary\n\n'
                    "Be accurate about seniority level based on job titles and responsibilities described."
                ),
            },
            {"role": "user", "content": resume_text},
        ],
    )
    data = json.loads(response.choices[0].message.content)
    return ResumeProfile(**data)
