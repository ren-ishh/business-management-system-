// frontend/src/services/api.js
const API_BASE_URL = "http://localhost:8000/api";

export const loginUser = async (username, password) => {
  try {
    // Calling the FastAPI endpoint we just created
    const response = await fetch(`${API_BASE_URL}/auth/login?username=${username}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
