enum FlashcardType {
  standard,
  cloze,
  imageOcclusion;

  String get value => name;

  static FlashcardType fromString(String value) {
    return FlashcardType.values.firstWhere(
      (type) => type.name == value,
      orElse: () => FlashcardType.standard,
    );
  }

  String get displayName {
    switch (this) {
      case FlashcardType.standard:
        return 'Standard';
      case FlashcardType.cloze:
        return 'Cloze';
      case FlashcardType.imageOcclusion:
        return 'Image Occlusion';
    }
  }
}
