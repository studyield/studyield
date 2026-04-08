import 'package:flutter/material.dart';

class LevelInfo {
  final String name;
  final List<Color> gradientColors;
  final Color textColor;

  const LevelInfo({
    required this.name,
    required this.gradientColors,
    required this.textColor,
  });

  LinearGradient get gradient => LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: gradientColors,
  );
}

class LevelConstants {
  LevelConstants._();

  static const List<int> thresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];

  static const List<LevelInfo> levels = [
    // 0: Beginner (gray-400 → gray-500)
    LevelInfo(
      name: 'Beginner',
      gradientColors: [Color(0xFF9CA3AF), Color(0xFF6B7280)],
      textColor: Color(0xFF6B7280),
    ),
    // 1: Bronze (amber-600 → amber-700)
    LevelInfo(
      name: 'Bronze',
      gradientColors: [Color(0xFFD97706), Color(0xFFB45309)],
      textColor: Color(0xFFD97706),
    ),
    // 2: Silver (slate-400 → slate-500)
    LevelInfo(
      name: 'Silver',
      gradientColors: [Color(0xFF94A3B8), Color(0xFF64748B)],
      textColor: Color(0xFF64748B),
    ),
    // 3: Gold (yellow-400 → yellow-500)
    LevelInfo(
      name: 'Gold',
      gradientColors: [Color(0xFFFACC15), Color(0xFFEAB308)],
      textColor: Color(0xFFEAB308),
    ),
    // 4: Platinum (cyan-400 → cyan-500)
    LevelInfo(
      name: 'Platinum',
      gradientColors: [Color(0xFF22D3EE), Color(0xFF06B6D4)],
      textColor: Color(0xFF06B6D4),
    ),
    // 5: Diamond (blue-400 → blue-500)
    LevelInfo(
      name: 'Diamond',
      gradientColors: [Color(0xFF60A5FA), Color(0xFF3B82F6)],
      textColor: Color(0xFF3B82F6),
    ),
    // 6: Master (purple-500 → purple-600)
    LevelInfo(
      name: 'Master',
      gradientColors: [Color(0xFFA855F7), Color(0xFF9333EA)],
      textColor: Color(0xFFA855F7),
    ),
    // 7: Grandmaster (red-500 → rose-600)
    LevelInfo(
      name: 'Grandmaster',
      gradientColors: [Color(0xFFEF4444), Color(0xFFE11D48)],
      textColor: Color(0xFFEF4444),
    ),
    // 8: Champion (orange-500 → red-500)
    LevelInfo(
      name: 'Champion',
      gradientColors: [Color(0xFFF97316), Color(0xFFEF4444)],
      textColor: Color(0xFFF97316),
    ),
    // 9: Legend (indigo-500 → violet-600)
    LevelInfo(
      name: 'Legend',
      gradientColors: [Color(0xFF6366F1), Color(0xFF7C3AED)],
      textColor: Color(0xFF6366F1),
    ),
    // 10: Mythic (fuchsia-500 → pink-600)
    LevelInfo(
      name: 'Mythic',
      gradientColors: [Color(0xFFD946EF), Color(0xFFDB2777)],
      textColor: Color(0xFFD946EF),
    ),
    // 11: Immortal (amber-400 → red-500 → purple-600)
    LevelInfo(
      name: 'Immortal',
      gradientColors: [Color(0xFFFBBF24), Color(0xFFEF4444), Color(0xFF9333EA)],
      textColor: Color(0xFFFBBF24),
    ),
  ];

  static LevelInfo getLevelInfo(int level) {
    return levels[level.clamp(0, levels.length - 1)];
  }
}
