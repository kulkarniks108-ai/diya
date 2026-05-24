import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'app/second_eye_app.dart';
import 'core/config/app_config.dart';
import 'core/hardware/providers/hardware_providers.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await dotenv.load(fileName: '.env', isOptional: true);
  } on FileNotFoundError {
    // Allow local runs without a .env file.
  }

  AppConfig.validate();

  final sharedPrefs = await SharedPreferences.getInstance();
  
  runApp(
    ProviderScope(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(sharedPrefs),
      ],
      child: const SecondEyeApp(),
    ),
  );
}
