const loginSection = document.getElementById('login');
const dataSection = document.getElementById('data-section');
const adminSection = document.getElementById('admin-section');
const dataList = document.getElementById('data-list');
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const importBtn = document.getElementById('import-btn');
const exportBtn = document.getElementById('export-btn');
const addAwardBtn = document.getElementById('add-award-btn');
const removeAwardBtn = document.getElementById('remove-award-btn');
const addPlayerBtn = document.getElementById('add-player-btn');
const removePlayerBtn = document.getElementById('remove-player-btn');

let isAdmin = false; // Admin login status
let githubToken = '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'; // GitHub Personal Access Token for Admin

// GitHub repo info
const owner = 'Tjorn822'; // GitHub username
const repo = 'https://github.com/Tjorn822/NLGawards'; // GitHub repo name
const filePath = 'data.json'; // Path to your JSON file in the repo

// Handle login action
loginBtn.addEventListener('click', () => {
  const username = usernameInput.value;
  const password = passwordInput.value;

  // Admin Login Check: Username "Staff" and Password "Oreo"
  if (username === 'Staff' && password === 'Oreo') {
    isAdmin = true;
    loginSection.style.display = 'none';
    dataSection.style.display = 'block';
    adminSection.style.display = 'block';
    fetchData(); // Fetch data for Admin
  }
  // User Login Check: Username "Guest" with no password
  else if (username === 'Guest' && password === '') {
    isAdmin = false;
    loginSection.style.display = 'none';
    dataSection.style.display = 'block';
    adminSection.style.display = 'none';
    fetchData(); // Fetch data for User
  }
  else {
    alert('Incorrect login credentials!');
  }
});

// Fetch and display data from GitHub
async function fetchData() {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`);
    const data = await response.json();

    if (data.message && data.message === 'Not Found') {
      alert('Data file not found in GitHub repository.');
      return;
    }

    const content = atob(data.content); // Decode base64 content
    const jsonData = JSON.parse(content);

    // Display the data in a list format
    dataList.innerHTML = `
      <h3>Awards</h3>
      ${jsonData.awards.map(award => `
        <div class="data-item" id="award-${award.name}">
          <h4>${award.name}</h4>
          <p>${award.description}</p>
          <p>Awarded to: ${award.awardedTo}</p>
          ${isAdmin ? `
            <button onclick="editAward('${award.name}')">Edit</button>
            <button onclick="removeAward('${award.name}')">Remove</button>
          ` : ''}
        </div>
      `).join('')}
      
      <h3>Players</h3>
      ${jsonData.players.map(player => `
        <div class="data-item" id="player-${player.name}">
          <h4>${player.name}</h4>
          <p>Rank: ${player.rank}</p>
          ${isAdmin ? `
            <button onclick="removePlayer('${player.name}')">Remove</button>
          ` : ''}
        </div>
      `).join('')}
    `;

    // If the user is an admin, enable the admin section
    if (isAdmin) {
      adminSection.style.display = 'block';
    } else {
      adminSection.style.display = 'none';
    }

  } catch (error) {
    alert('Error fetching data from GitHub.');
    console.error(error);
  }
}

// Handle importing JSON data
importBtn.addEventListener('click', () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
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
exportBtn.addEventListener('click', async () => {
  if (!isAdmin) {
    alert('Admins only for export');
    return;
  }

  const response = await fetchGitHubData();
  const jsonBlob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(jsonBlob);
  link.download = 'data.json';
  link.click();
});

// Handle adding an award
addAwardBtn.addEventListener('click', () => {
  const awardName = prompt('Enter the name of the new award:');
  const awardDescription = prompt('Enter the description of the award:');
  const awardedTo = prompt('Enter the name of the person awarded:');
  
  if (awardName && awardDescription && awardedTo) {
    const newAward = { name: awardName, description: awardDescription, awardedTo: awardedTo };
    
    fetchGitHubData().then(async (data) => {
      data.awards.push(newAward);
      await updateGitHubData(data);
      fetchData();
    });
  } else {
    alert('All fields are required to add an award!');
  }
});

// Handle removing an award
async function removeAward(awardName) {
  const confirmation = confirm(`Are you sure you want to remove the award: ${awardName}?`);
  if (confirmation) {
    const data = await fetchGitHubData();
    data.awards = data.awards.filter(award => award.name !== awardName);
    await updateGitHubData(data);
    fetchData();
  }
}

// Handle adding a player
addPlayerBtn.addEventListener('click', () => {
  const playerName = prompt('Enter the name of the new player:');
  const playerRank = prompt('Enter the rank of the player:');
  
  if (playerName && playerRank) {
    const newPlayer = { name: playerName, rank: playerRank };
    
    fetchGitHubData().then(async (data) => {
      data.players.push(newPlayer);
      await updateGitHubData(data);
      fetchData();
    });
  } else {
    alert('Both fields are required to add a player!');
  }
});

// Handle removing a player
async function removePlayer(playerName) {
  const confirmation = confirm(`Are you sure you want to remove the player: ${playerName}?`);
  if (confirmation) {
    const data = await fetchGitHubData();
    data.players = data.players.filter(player => player.name !== playerName);
    await updateGitHubData(data);
    fetchData();
  }
}

// Edit an award (admin only)
async function editAward(awardName) {
  const data = await fetchGitHubData();
  const award = data.awards.find(a => a.name === awardName);

  const newName = prompt('Edit award name:', award.name);
  const newDescription = prompt('Edit award description:', award.description);
  const newAwardedTo = prompt('Edit award recipient:', award.awardedTo);

  if (newName && newDescription && newAwardedTo) {
    award.name = newName;
    award.description = newDescription;
    award.awardedTo = newAwardedTo;

    await updateGitHubData(data);
    fetchData();
  } else {
    alert('All fields are required to edit the award!');
  }
}

// Fetch GitHub data
async function fetchGitHubData() {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`);
  const data = await response.json();
  const content = atob(data.content); // Decode base64 content
  return JSON.parse(content);
}

// Update GitHub data (for Admins only)
async function updateGitHubData(content) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${githubToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Updating data file',
      content: btoa(JSON.stringify(content, null, 2)), // Base64 encode content
      sha: await getGitHubFileSha(), // Get file sha for updating
    }),
  });

  const result = await response.json();
  if (result.message && result.message === 'Not Found') {
    alert('Data file not found, unable to update.');
    return;
  }

  alert('Data updated successfully!');
}

// Get the sha of the existing file to enable updating
async function getGitHubFileSha() {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`);
  const data = await response.json();
  return data.sha;
}
