const loginSection = document.getElementById("login");
const dataSection = document.getElementById("data-section");
const adminSection = document.getElementById("admin-section");
const dataList = document.getElementById("data-list");
const loginBtn = document.getElementById("login-btn");
const passwordInput = document.getElementById("password");
const importBtn = document.getElementById("import-btn");
const exportBtn = document.getElementById("export-btn");
const addAwardBtn = document.getElementById("add-award-btn");
const removeAwardBtn = document.getElementById("remove-award-btn");
const addPlayerBtn = document.getElementById("add-player-btn");
const removePlayerBtn = document.getElementById("remove-player-btn");

let isAdmin = false;
let githubToken = "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"; // GitHub Personal Access Token for Admin

// GitHub repo info
const owner = "Tjorn822"; // GitHub username
const repo = "NLGawards"; // GitHub repo name
const filePath = "../data.json"; // Path to your JSON file in the repo

// Handle login action
loginBtn.addEventListener("click", () => {
  const password = passwordInput.value;
  if (password === "Oreo") {
    isAdmin = true;
    loginSection.style.display = "none";
    dataSection.style.display = "block";
    adminSection.style.display = "block";
    fetchData();
  } else {
    alert("Incorrect password for admin!");
  }
});

// Fetch and display data from GitHub
async function fetchData() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`
    );
    const data = await response.json();

    if (data.message && data.message === "Not Found") {
      alert("Data file not found in GitHub repository.");
      return;
    }

    const content = atob(data.content); // Decode base64 content
    const jsonData = JSON.parse(content);

    dataList.innerHTML = `
      <h3>Awards</h3>
      ${jsonData.awards
        .map(
          (award) => `
        <div>
          <h4>${award.name}</h4>
          <p>${award.description}</p>
          <p>Awarded to: ${award.awardedTo}</p>
        </div>
      `
        )
        .join("")}
      
      <h3>Players</h3>
      ${jsonData.players
        .map(
          (player) => `
        <div>
          <h4>${player.name}</h4>
          <p>Rank: ${player.rank}</p>
        </div>
      `
        )
        .join("")}
    `;
  } catch (error) {
    alert("Error fetching data from GitHub.");
    console.error(error);
  }
}

// Handle importing JSON data
importBtn.addEventListener("click", () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json";
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    // Process the imported file, upload it to GitHub, and update JSON
    const reader = new FileReader();
    reader.onload = async function () {
      const importedData = JSON.parse(reader.result);

      const content = await fetchGitHubData();
      content.awards.push(...importedData.awards);
      content.players.push(...importedData.players);

      await updateGitHubData(content);
      fetchData();
    };
    reader.readAsText(file);
  });
  fileInput.click();
});

// Handle exporting JSON data
exportBtn.addEventListener("click", async () => {
  if (!isAdmin) {
    alert("Admins only for export");
    return;
  }

  const response = await fetchGitHubData();
  const jsonBlob = new Blob([JSON.stringify(response, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(jsonBlob);
  link.download = "data.json";
  link.click();
});

// Fetch GitHub data
async function fetchGitHubData() {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`
  );
  const data = await response.json();

  const content = atob(data.content); // Decode base64 content
  return JSON.parse(content);
}

// Update GitHub data (for Admins only)
async function updateGitHubData(content) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Updating data file",
        content: btoa(JSON.stringify(content, null, 2)), // Base64 encode content
        sha: await getGitHubFileSha(), // Get file sha for updating
      }),
    }
  );

  const result = await response.json();
  if (result.message && result.message === "Not Found") {
    alert("Data file not found, unable to update.");
    return;
  }

  alert("Data updated successfully!");
}

// Get the sha of the existing file to enable updating
async function getGitHubFileSha() {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`
  );
  const data = await response.json();
  return data.sha;
}
