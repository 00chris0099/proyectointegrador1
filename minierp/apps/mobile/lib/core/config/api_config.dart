class ApiConfig {
  static const String baseUrl = 'http://localhost:3001';
  static const String appName = 'Mini-ERP La Asunción';

  // Endpoints
  static const String login = '/api/auth/login';
  static const String recover = '/api/auth/recover';
  static const String profile = '/api/users/profile';
  static const String alumnos = '/api/apoderados/me/alumnos';
  static const String tramites = '/api/tramites';
  static const String tramitesTipos = '/api/tramites/tipos';
  static const String tramitesMe = '/api/tramites/me';
  static const String estadoCuenta = '/api/tesoreria/estado-cuenta/me';
  static const String reportarPago = '/api/tesoreria/pagos/reportar';
}
