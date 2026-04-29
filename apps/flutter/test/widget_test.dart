// This is a basic Flutter widget test for the 2ndEye app.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:diya_flutter/app/second_eye_app.dart';

void main() {
  testWidgets('App can be created without crashing', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const ProviderScope(child: SecondEyeApp()));

    // Verify that the app was created successfully
    expect(find.byType(SecondEyeApp), findsOneWidget);
  });
}
