export const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  // Backend response
  const backendMessage =
    error?.response?.data?.message;

  if (
    typeof backendMessage === "string" &&
    backendMessage.trim()
  ) {
    return backendMessage;
  }

  // Axios error message
  if (
    typeof error?.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
};