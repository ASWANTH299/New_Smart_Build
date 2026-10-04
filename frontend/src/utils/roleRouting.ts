export const getDefaultRouteForRole = (role?: string): string => {
  switch (role?.toUpperCase()) {
    case "ADMIN":
      return "/dashboard";
    case "PROJECT_MANAGER":
      return "/projects";
    case "SITE_ENGINEER":
      return "/projects";
    case "CLIENT":
      return "/client-portal";
    case "CONTRACTOR":
    case "SUBCONTRACTOR":
      return "/projects";
    case "AUDITOR":
    case "FINANCE_OFFICER":
      return "/projects";
    default:
      return "/login";
  }
};
