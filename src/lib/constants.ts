export const SYLLABUS_OPTIONS = ["National", "Cambridge", "Edexcel"];
export const MEDIUM_OPTIONS = ["Tamil Medium (TM)", "English Medium (EM)"];

export const GRADE_OPTIONS = [
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade A/L (2027 Batch)"
];

// Mapping to subject lists based on Grade and Medium
export const SUBJECT_MAPPINGS: Record<string, Record<string, string[]>> = {
  "Grade 3": {
    "Tamil Medium (TM)": ["Maths", "Science", "Tamil", "IQ", "English"],
  },
  "Grade 4": {
    "Tamil Medium (TM)": ["Maths", "Science", "Tamil", "IQ", "English"],
  },
  "Grade 5": {
    "Tamil Medium (TM)": ["Maths", "Science", "Tamil", "IQ", "English", "Spoken English"],
  },
  "Grade 6": {
    "Tamil Medium (TM)": ["Maths", "Science", "Tamil", "English", "History", "ICT"],
    "English Medium (EM)": ["Maths", "Science", "Tamil", "English", "History", "ICT"],
  },
  "Grade 7": {
    "Tamil Medium (TM)": ["Maths", "Science", "Tamil", "English", "History", "ICT"],
    "English Medium (EM)": ["Maths", "Science", "Tamil", "English", "History", "ICT"],
  },
  "Grade 8": {
    "Tamil Medium (TM)": ["Maths", "Science", "Tamil", "English", "History", "ICT"],
    "English Medium (EM)": ["Maths", "Science", "Tamil", "English", "History", "ICT"],
  },
  "Grade 9": {
    "Tamil Medium (TM)": ["Maths", "Science", "Tamil", "English", "History", "ICT"],
    "English Medium (EM)": ["Maths", "Science", "Tamil", "English", "History", "ICT"],
  },
  "Grade 10": {
    "Tamil Medium (TM)": ["Maths", "Science", "Tamil", "English", "History", "ICT"],
    "English Medium (EM)": ["Maths", "Science", "Tamil", "English", "History", "ICT"],
  },
  "Grade 11": {
    "Tamil Medium (TM)": ["Maths", "Science", "Tamil", "English", "History", "ICT"],
    "English Medium (EM)": ["Maths", "Science", "Tamil", "English", "History", "ICT"],
  },
  "Grade A/L (2027 Batch)": {
    "Tamil Medium (TM)": ["Physics", "Combined Maths"],
  }
};
