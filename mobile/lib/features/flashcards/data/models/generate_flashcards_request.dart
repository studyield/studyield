class GenerateFlashcardsRequest {
  final String content;
  final int? count;
  final String? cardType;
  final String? difficulty;

  GenerateFlashcardsRequest({
    required this.content,
    this.count,
    this.cardType,
    this.difficulty,
  });

  Map<String, dynamic> toJson() {
    String adjustedContent = content;

    // Append instructions in content like frontend does
    if (cardType != null && cardType!.isNotEmpty) {
      if (cardType == 'fill_blank') {
        adjustedContent += '\n\n[Instruction: Generate fill-in-the-blank flashcards where the front has a sentence with a blank and the back has the missing word/phrase.]';
      } else if (cardType == 'true_false') {
        adjustedContent += '\n\n[Instruction: Generate true/false flashcards where the front is a statement and the back is "True" or "False" with a brief explanation.]';
      }
    }
    if (difficulty != null && difficulty!.isNotEmpty) {
      if (difficulty == 'easy') {
        adjustedContent += '\n\n[Instruction: Keep questions simple, suitable for beginners.]';
      } else if (difficulty == 'hard') {
        adjustedContent += '\n\n[Instruction: Make questions challenging, requiring deep understanding.]';
      }
    }

    final Map<String, dynamic> json = {
      'content': adjustedContent,
    };

    if (count != null) {
      json['count'] = count;
    }

    return json;
  }
}
