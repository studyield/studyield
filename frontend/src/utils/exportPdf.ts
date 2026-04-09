import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ExamQuestion {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string | null;
  difficulty: string;
  topic: string | null;
}

interface ExportOptions {
  title: string;
  subject?: string;
  includeAnswers: boolean;
  includeExplanations: boolean;
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      startY?: number;
      head?: string[][];
      body?: string[][];
      theme?: string;
      headStyles?: { fillColor: number[] };
      columnStyles?: Record<number, { cellWidth?: number | string; halign?: string }>;
      margin?: { left?: number; right?: number };
    }) => jsPDF;
  }
}

export function exportQuestionsToPdf(
  questions: ExamQuestion[],
  options: ExportOptions
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Subject
  if (options.subject) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subject: ${options.subject}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
  }

  // Date
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 15;

  // Stats
  doc.setFontSize(10);
  doc.text(`Total Questions: ${questions.length}`, margin, yPos);
  yPos += 6;

  const difficultyCount = questions.reduce(
    (acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  doc.text(
    `Difficulty: Easy ${difficultyCount.easy || 0} | Medium ${difficultyCount.medium || 0} | Hard ${difficultyCount.hard || 0}`,
    margin,
    yPos
  );
  yPos += 15;

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Questions
  questions.forEach((question, index) => {
    // Check if we need a new page
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }

    // Question number and difficulty badge
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Question ${index + 1}`, margin, yPos);

    // Difficulty badge
    const diffColor =
      question.difficulty === 'easy'
        ? [34, 197, 94]
        : question.difficulty === 'medium'
        ? [245, 158, 11]
        : [239, 68, 68];
    doc.setFillColor(diffColor[0], diffColor[1], diffColor[2]);
    doc.roundedRect(margin + 60, yPos - 5, 25, 7, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(question.difficulty, margin + 62, yPos);
    doc.setTextColor(0, 0, 0);

    // Topic
    if (question.topic) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      doc.text(`[${question.topic}]`, margin + 90, yPos);
      doc.setTextColor(0, 0, 0);
    }

    yPos += 8;

    // Question text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const questionLines = doc.splitTextToSize(question.question, pageWidth - margin * 2);
    doc.text(questionLines, margin, yPos);
    yPos += questionLines.length * 5 + 5;

    // Options (for MCQ)
    if (question.options && question.options.length > 0) {
      question.options.forEach((opt, i) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const letter = String.fromCharCode(65 + i);
        const isCorrect = opt === question.correctAnswer;

        if (options.includeAnswers && isCorrect) {
          doc.setFillColor(220, 252, 231);
          doc.roundedRect(margin, yPos - 4, pageWidth - margin * 2, 7, 1, 1, 'F');
        }

        doc.setFontSize(10);
        doc.text(`${letter}) ${opt}`, margin + 5, yPos);

        if (options.includeAnswers && isCorrect) {
          doc.setTextColor(34, 197, 94);
          doc.text(' (Correct)', margin + 5 + doc.getTextWidth(`${letter}) ${opt}`), yPos);
          doc.setTextColor(0, 0, 0);
        }

        yPos += 7;
      });
    }

    // Correct answer (for non-MCQ or if answers included)
    if (options.includeAnswers && (!question.options || question.options.length === 0)) {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text(`Answer: ${question.correctAnswer}`, margin, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      yPos += 7;
    }

    // Explanation
    if (options.includeExplanations && question.explanation) {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(9);
      doc.setTextColor(59, 130, 246);
      doc.text('Explanation:', margin, yPos);
      yPos += 5;
      doc.setTextColor(100, 100, 100);
      const explanationLines = doc.splitTextToSize(question.explanation, pageWidth - margin * 2);
      doc.text(explanationLines, margin, yPos);
      yPos += explanationLines.length * 4 + 3;
      doc.setTextColor(0, 0, 0);
    }

    yPos += 8;

    // Divider
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
  });

  // Answer key page (if answers not included inline)
  if (!options.includeAnswers) {
    doc.addPage();
    yPos = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Answer Key', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Create answer table
    const tableData = questions.map((q, i) => [
      `${i + 1}`,
      q.correctAnswer.length > 50 ? q.correctAnswer.substring(0, 50) + '...' : q.correctAnswer,
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['#', 'Correct Answer']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [147, 51, 234] },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
    });
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount} | Generated by Studyield`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  const filename = `${options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_questions.pdf`;
  doc.save(filename);
}
