import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get('grade');

    if (!grade) {
      return NextResponse.json({ error: "Grade is required" }, { status: 400 });
    }

    // Map the incoming grade string (e.g., "Grade 3") to the JSON format (e.g., "G3")
    let mappedGrade = grade;
    const match = grade.match(/\d+/);
    if (match) {
      mappedGrade = `G${match[0]}`;
    } else if (grade.includes("A/L") || grade.includes("AL")) {
      mappedGrade = "G12"; // Assuming A/L maps to G12 or AL in JSON.
    }

    // Read JSON file
    const filePath = path.join(process.cwd(), 'EDUS_YGC_2026_Questions_Only.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const questions = JSON.parse(fileContents);

    // Filter questions by grade
    const filteredQuestions = questions.filter((q: any) => {
      return q.grade_or_track === mappedGrade || q.grade_or_track === grade || q.grade_or_track === 'AL';
    });

    if (filteredQuestions.length === 0) {
      // Fallback: If no exact match, just return some random questions from the first grade available
      const fallbackQuestions = questions.filter((q: any) => q.grade_or_track === 'G3' || q.grade_or_track === 'G1');
      const shuffledFallback = fallbackQuestions.sort(() => 0.5 - Math.random()).slice(0, 5);
      return NextResponse.json(shuffledFallback);
    }

    // Pick 5 random questions
    const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 5);

    return NextResponse.json(selectedQuestions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
