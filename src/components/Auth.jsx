export function saveToken(token, setToken) {
    localStorage.setItem("token", token);
    setToken(token);
  }
  
  export function getToken() {
    return localStorage.getItem("token");
  }
  
  export function clearToken(setToken) {
    localStorage.removeItem("token");
    setToken(null);
  }