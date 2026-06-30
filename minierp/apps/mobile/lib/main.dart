import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/config/api_config.dart';
import 'core/services/auth_service.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/forgot_password_screen.dart';
import 'features/auth/screens/reset_password_screen.dart';
import 'features/home/screens/home_screen.dart';
import 'features/perfil/screens/profile_screen.dart';
import 'features/alumnos/screens/students_screen.dart';
import 'features/alumnos/screens/linking_request_screen.dart';
import 'features/tramites/screens/tramites_screen.dart';
import 'features/tramites/screens/new_tramite_screen.dart';
import 'features/tramites/screens/tramite_detail_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [ChangeNotifierProvider(create: (_) => AuthService())],
      child: MaterialApp(
        title: ApiConfig.appName,
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedMaterial: Colors.blue,
            brightness: Brightness.light,
          ),
          useMaterial3: true,
        ),
        initialRoute: '/',
        routes: {
          '/': (context) => const AuthWrapper(),
          '/login': (context) => const LoginScreen(),
          '/forgot-password': (context) => const ForgotPasswordScreen(),
          '/reset-password': (context) => const ResetPasswordScreen(),
          '/home': (context) => const HomeScreen(),
          '/profile': (context) => const ProfileScreen(),
          '/students': (context) => const StudentsScreen(),
          '/linking-request': (context) => const LinkingRequestScreen(),
          '/tramites': (context) => const TramitesScreen(),
          '/new-tramite': (context) => const NewTramiteScreen(),
          '/tramite-detail': (context) {
            final args = ModalRoute.of(context)!.settings.arguments as String;
            return TramiteDetailScreen(tramiteId: args);
          },
        },
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthService>(
      builder: (context, auth, _) {
        if (auth.isLoading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (auth.isAuthenticated) {
          return const HomeScreen();
        }
        return const LoginScreen();
      },
    );
  }
}
