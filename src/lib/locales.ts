export type LocaleData = {
  // Step 1
  studentDetailsTitle: string;
  studentDetailsDesc: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  schoolLabel: string;
  schoolPlaceholder: string;
  optionalText: string;
  backBtn: string;
  continueBtn: string;

  // Step 2
  academicTitle: string;
  academicDesc: string;
  syllabusLabel: string;
  syllabusPlaceholder: string;
  gradeLabel: string;
  gradePlaceholder: string;
  mediumLabel: string;
  mediumPlaceholder: string;
  customReqTitle: string;
  customReqDesc: (syllabus: string) => string;
  selectSubjectsLabel: string;
  selectSyllabusAlert: string;

  // Step 3
  parentTitle: string;
  parentDesc: string;
  parentNameLabel: string;
  parentNamePlaceholder: string;
  addressLabel: string;
  addressPlaceholder: string;
  districtLabel: string;
  districtPlaceholder: string;
  submitBtn: string;

  // Step 4
  successTitle: string;
  successDesc: string;
  contactTitle: string;
  sendWhatsapp: string;
  callUs: string;
};

export const locales: Record<string, LocaleData> = {
  English: {
    studentDetailsTitle: "Student Details",
    studentDetailsDesc: "Tell us a bit about yourself.",
    fullNameLabel: "Full Name",
    fullNamePlaceholder: "Enter your name",
    phoneLabel: "Phone Number",
    phonePlaceholder: "07xxxxxxxx",
    schoolLabel: "School",
    schoolPlaceholder: "Enter your school name",
    optionalText: "(Optional)",
    backBtn: "Back",
    continueBtn: "Continue",

    academicTitle: "Academic Information",
    academicDesc: "Select your syllabus, grade, and medium.",
    syllabusLabel: "Syllabus",
    syllabusPlaceholder: "Select Syllabus",
    gradeLabel: "Grade",
    gradePlaceholder: "Select Grade",
    mediumLabel: "Medium",
    mediumPlaceholder: "Select Medium",
    customReqTitle: "Custom Requirements",
    customReqDesc: (syllabus: string) => `We have all subjects available for ${syllabus}. Our student consultant will contact you to collect your specific requirements.`,
    selectSubjectsLabel: "Select Subjects",
    selectSyllabusAlert: "Please select Syllabus, Grade, and Medium",

    parentTitle: "Parent / Guardian Details",
    parentDesc: "How can we contact your parents?",
    parentNameLabel: "Parent Name",
    parentNamePlaceholder: "Enter parent's name",
    addressLabel: "Address",
    addressPlaceholder: "Enter full address",
    districtLabel: "District",
    districtPlaceholder: "e.g. Colombo",
    submitBtn: "Submit Registration",

    successTitle: "Registration Successful!",
    successDesc: "Thanks for your interest in studying at EDUS. Our student consultant will call you shortly to give the details and guide you to join the classes.",
    contactTitle: "Contact Us Now",
    sendWhatsapp: "Send via WhatsApp",
    callUs: "Call",
  },
  Tamil: {
    studentDetailsTitle: "மாணவர் விவரங்கள்",
    studentDetailsDesc: "உங்களைப் பற்றி கொஞ்சம் சொல்லுங்கள்.",
    fullNameLabel: "முழுப் பெயர்",
    fullNamePlaceholder: "உங்கள் பெயரை உள்ளிடவும்",
    phoneLabel: "தொலைபேசி எண்",
    phonePlaceholder: "07xxxxxxxx",
    schoolLabel: "பாடசாலை",
    schoolPlaceholder: "பாடசாலையின் பெயரை உள்ளிடவும்",
    optionalText: "(விருப்பமானால்)",
    backBtn: "பின்செல்",
    continueBtn: "தொடர்க",

    academicTitle: "கல்வி விவரங்கள்",
    academicDesc: "உங்கள் பாடத்திட்டம், தரம் மற்றும் மொழி மூலத்தை தேர்ந்தெடுக்கவும்.",
    syllabusLabel: "பாடத்திட்டம்",
    syllabusPlaceholder: "பாடத்திட்டத்தை தேர்ந்தெடுக்கவும்",
    gradeLabel: "தரம்",
    gradePlaceholder: "தரத்தை தேர்ந்தெடுக்கவும்",
    mediumLabel: "மொழி மூலம்",
    mediumPlaceholder: "மொழி மூலத்தை தேர்ந்தெடுக்கவும்",
    customReqTitle: "தனிப்பயன் தேவைகள்",
    customReqDesc: (syllabus: string) => `${syllabus} க்கான அனைத்துப் பாடங்களும் எங்களிடம் உள்ளன. உங்கள் தேவைகளைப் பெற எங்கள் மாணவர் ஆலோசகர் உங்களை தொடர்புகொள்வார்.`,
    selectSubjectsLabel: "பாடங்களை தேர்ந்தெடுக்கவும்",
    selectSyllabusAlert: "தயவுசெய்து பாடத்திட்டம், தரம் மற்றும் மொழி மூலத்தை தேர்ந்தெடுக்கவும்",

    parentTitle: "பெற்றோர் / பாதுகாவலர் விவரங்கள்",
    parentDesc: "நாங்கள் உங்கள் பெற்றோரை எவ்வாறு தொடர்புகொள்வது?",
    parentNameLabel: "பெற்றோரின் பெயர்",
    parentNamePlaceholder: "பெற்றோரின் பெயரை உள்ளிடவும்",
    addressLabel: "முகவரி",
    addressPlaceholder: "முழு முகவரியை உள்ளிடவும்",
    districtLabel: "மாவட்டம்",
    districtPlaceholder: "உதாரணம்: கொழும்பு",
    submitBtn: "பதிவு செய்",

    successTitle: "பதிவு வெற்றிகரமானது!",
    successDesc: "EDUS இல் பயில ஆர்வம் காட்டியமைக்கு நன்றி. எமது மாணவர் ஆலோசகர் விரைவில் உங்களை தொடர்புகொண்டு மேலதிக விவரங்களை வழங்குவார்.",
    contactTitle: "இப்போது எங்களை தொடர்புகொள்ளவும்",
    sendWhatsapp: "WhatsApp மூலம் அனுப்பவும்",
    callUs: "அழைக்க",
  }
};
