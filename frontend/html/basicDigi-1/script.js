// Login Function
async function login() {
    const aadhaar = document.getElementById("aadhaar").value;
    const password = document.getElementById("password").value;

    const response = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhaar, password })
    });

    const data = await response.json();
    if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("aadhaar", aadhaar);
        window.location.href = data.role === "admin" ? "admin.html" : "citizen.html";
    } else {
        alert("Invalid Credentials");
    }
}

// Signup Function
async function signup() {
    const aadhaar = document.getElementById("aadhaar").value;
    const phone = document.getElementById("phone").value;
    const password = document.getElementById("password").value;

    const response = await fetch("http://localhost:4000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhaar, phone, password, role: "citizen" })
    });

    const data = await response.json();
    alert(data.message);
    if (response.ok) window.location.href = "index.html";
}

// Upload Document (Admin)
async function uploadDoc() {
    const formData = new FormData();
    formData.append("file", document.getElementById("file").files[0]);
    formData.append("uploadedBy", document.getElementById("aadhaar").value);

    const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData
    });

    const data = await response.json();
    alert("File Uploaded! Extracted Text: " + data.extractedText);
    loadDocs();
}

// Load Documents for Admin
async function loadDocs() {
    const response = await fetch("http://localhost:4000/documents");
    const docs = await response.json();

    let html = "";
    docs.forEach((doc) => {
        html += `<tr>
                    <td id="filename-${doc._id}">${doc.filename}</td>
                    <td>${doc.label}</td>
                    <td>${doc.uploadedBy}</td>
                    <td>${new Date(doc.createdAt).toLocaleString()}</td>
                    <td><a href="${doc.fileUrl}" download>Download</a></td>
                    <td>
                        <button class="rename-btn" onclick="renameFile('${doc._id}', '${doc.filename}')">Rename</button>
                        <button class="delete-btn" onclick="deleteFile('${doc._id}')">Delete</button>
                    </td>
                 </tr>`;
    });
    document.getElementById("documentTable").innerHTML = html;
}

// ✅ Rename File Function
async function renameFile(docId, oldName) {
    const newName = prompt("Enter new file name:", oldName);
    if (!newName) return;

    const response = await fetch(`http://localhost:4000/rename/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newFilename: newName }),
    });

    if (response.ok) {
        document.getElementById(`filename-${docId}`).innerText = newName;
        alert("Filename updated successfully!");
    } else {
        alert("Error renaming file.");
    }
}

// Load Documents for Citizen
async function loadUserDocs() {
    const aadhaar = localStorage.getItem("aadhaar");
    const response = await fetch(`http://localhost:4000/documents/${aadhaar}`);
    const docs = await response.json();

    let html = "<tr><th>File Name</th><th>Download</th><th>Extracted Text</th></tr>";
    docs.forEach(doc => {
        html += `<tr>
            <td>${doc.filename}</td>
            <td><a href="${doc.fileUrl}" download>Download</a></td>
            <td>${doc.extractedText}</td>
            <td><button class="delete-btn" onclick="deleteDocument('${doc._id}')">Delete</button></td>
        </tr>`;
    });
    document.getElementById("docs").innerHTML = html;
}

// ✅ Delete Document Function
async function deleteDocument(docId) {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
        const response = await fetch(`http://localhost:4000/delete/${docId}`, {
            method: "DELETE"
        });

        const result = await response.json();
        alert(result.message);
        fetchDocuments(); // ✅ Refresh list after deletion
    } catch (error) {
        console.error("Error deleting document:", error);
    }
}

// Logout
function logout() {
    localStorage.clear();
    window.location.href = "basicindex.html";
}

document.addEventListener("DOMContentLoaded", () => {
    fetchDocuments();
});

// ✅ Handle File Upload
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const aadhaar = document.getElementById("aadhaar").value;
    const label = document.getElementById("label").value;
    const file = document.getElementById("file").files[0];

    if (!file) {
        alert("Please select a file.");
        return;
    }

    const formData = new FormData();
    formData.append("uploadedBy", aadhaar);
    formData.append("label", label);
    formData.append("file", file);

    try {
        const response = await fetch("http://localhost:4000/upload", {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        alert(result.message);
        fetchDocuments(); // ✅ Refresh document history dynamically
    } catch (error) {
        console.error("Error uploading document:", error);
    }
});

// ✅ Fetch & Display Documents
async function fetchDocuments() {
    try {
        const response = await fetch("http://localhost:4000/documents");
        const documents = await response.json();

        const tableBody = document.getElementById("documentTable");
        tableBody.innerHTML = ""; // ✅ Clear old data before updating

        documents.forEach(doc => {
            console.log("Document Data:", doc); // ✅ Debugging log

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${doc.filename}</td>
                <td>${doc.label || "No Label"}</td>
                <td>${doc.uploadedBy}</td>
                <td>${new Date(doc.uploadedAt).toLocaleString()}</td>
                <td><a href="${doc.fileUrl}" download>Download</a></td>
                <td><button class="rename-btn" onclick="renameFile('${doc._id}', '${doc.filename}')">Rename</button>
                        <button class="delete-btn" onclick="deleteDocument('${doc._id}')">Delete</button></td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error fetching documents:", error);
    }
}
