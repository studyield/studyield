class SubmitAttemptRequest {
  final List<AttemptAnswer> answers;
  final int totalTimeSpent;

  SubmitAttemptRequest({
    required this.answers,
    required this.totalTimeSpent,
  });

  Map<String, dynamic> toJson() {
    return {
      'answers': answers.map((a) => a.toJson()).toList(),
      'totalTimeSpent': totalTimeSpent,
    };
  }
}

class AttemptAnswer {
  final String questionId;
  final String answer;
  final int timeSpent;

  AttemptAnswer({
    required this.questionId,
    required this.answer,
    required this.timeSpent,
  });

  Map<String, dynamic> toJson() {
    return {
      'questionId': questionId,
      'answer': answer,
      'timeSpent': timeSpent,
    };
  }
}
