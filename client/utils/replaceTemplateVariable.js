export const replaceTemplateVariables = (
  content = "",
  variables = {}
) => {
  if (!content) {
    return "";
  }

  return content.replace(
    /{{\s*([^}]+)\s*}}/g,
    (match, variableName) => {
      const key = variableName.trim();

      if (
        variables[key] !== undefined &&
        variables[key] !== null
      ) {
        return String(variables[key]);
      }

      return match;
    }
  );
};

const getUserVariables = (email) => {
  const normalizedEmail =
    email?.trim().toLowerCase();

  const user = users.find(
    (item) =>
      item.email
        ?.trim()
        .toLowerCase() ===
      normalizedEmail
  );

  const now = new Date();

  return {
    name: user?.name || "",
    email: user?.email || email || "",
    role: user?.role || "",
    company:
      user?.company ||
      "Admin Dashboard",
    date: now.toLocaleDateString(),
    year: now.getFullYear(),
  };
};