const API_BASE_URL = "http://192.168.68.114/api";

export async function fetchData(path) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`);
    return await response.json();
  } catch (error) {
    console.error("API Fetch Error:", error);
    return null;
  }
}
export async function postData(path, data) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("API Post Error:", error);
    return null;
  }
}
export async function putData(path, data) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("API Put Error:", error);
    return null;
  }
}