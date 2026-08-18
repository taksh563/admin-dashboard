import {EMAIL_TEMPLATE_VARIABLES,} from "./emailTemplateVariables.js";

export const replaceTemplateVariables = (
  content,
  user = {}
) => {
  if (!content) {
    return "";
  }

  return content.replace(
    /{{\s*([\w]+)\s*}}/g,
    (match, variable) => {
      // Only replace supported variables
      if (
        !EMAIL_TEMPLATE_VARIABLES.includes(
          variable
        )
      ) {
        return match;
      }

      return user[variable] ?? "";
    }
  );
};