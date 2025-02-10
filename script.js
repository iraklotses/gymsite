document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const response = await fetch("https://gymsite-six.vercel.app/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (response.ok) {
        document.getElementById("message").innerText = "✅ Επιτυχής σύνδεση!";
        localStorage.setItem("token", result.token);
        window.location.href = "dashboard.html";
    } else {
        document.getElementById("message").innerText = "❌ Λάθος στοιχεία!";
    }
});
