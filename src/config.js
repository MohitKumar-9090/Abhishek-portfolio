export const GEMINI_API_KEY =
<<<<<<< HEAD
  import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyBOevbLfqKYGvKueJZw2-tS3zCrLBIifqk";
=======
  import.meta.env.VITE_GEMINI_API_KEY || "[REDACTED_GEMINI_KEY]";
>>>>>>> 5c3439f (Update Gemini key and stabilize chatbot backend integration)

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB0Fbn3rGfK9UNDg2wWwNYVW4cicyVciRc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "portfolio-493c0.firebaseapp.com",
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    "https://portfolio-493c0-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "portfolio-493c0",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "portfolio-493c0.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "672487254767",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:672487254767:web:ba27f9f93cb658985cc91a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-5W0WL4WXZ8"
};

export const portfolioContext = `
Developer Name: Abhishek Kumar
Role: Java Developer and MERN Stack Developer
Location: Amritsar, Punjab, India
Summary: Proactive Java and MERN stack developer with strong knowledge of Java, OOP concepts, and full-stack web development. Experienced in building responsive web and desktop applications.
Education:
- B.Tech Computer Science and Engineering, Amritsar Group of Colleges (2021 - Present), Amritsar, Punjab
- 12th Boards, Gov+2 High School (BSEB), Motihari, Bihar
- 10th Boards, Gov+2 High School (BSEB), Motihari, Bihar
Experience:
- Software Engineering Intern (Java Developer), Assets Compounders Academy Pvt Ltd.
- Built responsive UI with React, Redux and Material UI
- Built backend services with Node.js and enabled real-time admin-client dashboard synchronization
Projects:
- Stock Market Application (Zerodha Clone): MongoDB, Express, React, Node
- Employee Management System: Java, Swing, MySQL
- Manovaidya Wellness Website: PHP, HTML, CSS, JavaScript
Skills:
- Languages: Java, C++, JavaScript, HTML, CSS
- Frameworks: React, Redux, Node.js, Express.js
- Databases: MongoDB, SQL
- Tools: VS Code, IntelliJ IDEA, Eclipse, Postman, Git
- Concepts: OOP, REST APIs, Responsive Web Design, Data Structures
Achievements:
- Solved 150+ coding problems
- 4 star in C++ on HackerRank
- 3 star in Problem Solving on HackerRank
Extracurricular:
- GeeksForGeeks Chapter Lead and Technical Lead
- CodeChef Competitive Programming Lead at Student Chapter ACET
Contact:
- Email: abhishek8579013@gmail.com
- Phone: 6202000340
- GitHub: github.com/abhishekgfg?tab=repositories
- LinkedIn: linkedin.com/in/abhishek-kumar-847b74241
Chatbot rules:
- Answer only topics related to skills, projects, experience, education, contact information, and portfolio details.
- If unrelated, respond: "I only answer questions related to Abhishek Kumar's portfolio."
`;

export const emailJsConfig = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_e3bc8gi",
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_56l3tdt",
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "5Ndj6lBpf_A8T-UX9",
  toEmail: import.meta.env.VITE_EMAILJS_TO_EMAIL || "abhishek8579013@gmail.com"
};
