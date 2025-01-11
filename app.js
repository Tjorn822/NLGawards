// DOM Elements
const loginSection = document.getElementById('login-section');
const userDashboard = document.getElementById('user-dashboard');
const adminDashboard = document.getElementById('admin-dashboard');
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const userRoleSpan = document.getElementById('user-role');
const dataDisplay = document.getElementById('data-display');
const adminActions = document.getElementById('admin-actions');
const managePlayersBtn = document.getElementById('manage-players-btn');
const manageMedalsBtn = document.getElementById('manage-medals-btn');

let appData = { players: [], medals: [] };
let isAdmin = false;

// GitHub Repo Info
const owner = 'Tjorn822';
const repo = 'https://github.com/Tjorn822/NLGawards';
const filePath = 'data.json';

// Login
loginBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (username === 'Staff' && password === 'Oreo') {
    isAdmin = true;
    switchToAdminDashboard();
  } else if (username === 'Guest' && password === '') {
    isAdmin = false;
    switchToUserDashboard();
  } else {
    alert('Invalid credentials!');
  }
});

// Fetch Data from GitHub
async function fetchData() {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`);
  const file = await response.json();
  const content = JSON.parse(atob(file.content));
  appData = content;
  renderData();
}

// Render Data for Users
function renderData() {
  const playerInfo = appData.players
    .map(
      (player) => `
      <div>
        <h3>${player.name}</h3>
        <p>Medals: ${player.medals.length}</p>
        <ul>
          ${player.medals.map((medal) => `<li>${medal.name}: ${medal.reason}</li>`).join('')}
        </ul>
      </div>
    `
    )
    .join('');
  dataDisplay.innerHTML = playerInfo;
}

// Switch to User Dashboard
function switchToUserDashboard() {
  loginSection.style.display = 'none';
  userDashboard.style.display = 'block';
  userRoleSpan.textContent = 'User';
  fetchData();
}

// Switch to Admin Dashboard
function switchToAdminDashboard() {
  loginSection.style.display = 'none';
  adminDashboard.style.display = 'block';
  userRoleSpan.textContent = 'Admin';
  fetchData();
  setupAdminActions();
}

// Setup Admin Actions
function setupAdminActions() {
  adminActions.innerHTML = `
    <div id="player-actions" style="display: none;">
      <button onclick="addPlayer()">Add Player</button>
      <button onclick="removePlayer()">Remove Player</button>
    </div>
    <div id="medal-actions" style="display: none;">
      <button onclick="addMedal()">Add Medal</button>
      <button onclick="removeMedal()">Remove Medal</button>
    </div>
  `;

  managePlayersBtn.addEventListener('click', () => {
    document.getElementById('player-actions').style.display = 'block';
    document.getElementById('medal-actions').style.display = 'none';
  });

  manageMedalsBtn.addEventListener('click', () => {
    document.getElementById('player-actions').style.display = 'none';
    document.getElementById('medal-actions').style.display = 'block';
  });
}

// Admin Actions
function addPlayer() {
  const name = prompt('Enter player name:');
  appData.players.push({ name, medals: [] });
  updateData();
}

function removePlayer() {
  const name = prompt('Enter player name to remove:');
  appData.players = appData.players.filter((player) => player.name !== name);
  updateData();
}

function addMedal() {
  const medalName = prompt('Enter medal name:');
  const reason = prompt('Enter reason for medal:');
  const playerName = prompt('Enter player name to award medal to:');
  const player = appData.players.find((player) => player.name === playerName);
  if (player) {
    player.medals.push({ name: medalName, reason });
    updateData();
  } else {
    alert('Player not found!');
  }
}

function removeMedal() {
  const medalName = prompt('Enter medal name to remove:');
  const playerName = prompt('Enter player name:');
  const player = appData.players.find((player) => player.name === playerName);
  if (player) {
    player.medals = player.medals.filter((medal) => medal.name !== medalName);
    updateData();
  } else {
    alert('Player not found!');
  }
}

// Update Data on GitHub
async function updateData() {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      Authorization: `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`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Update data.json',
      content: btoa(JSON.stringify(appData, null, 2)),
      sha: await getFileSha(),
    }),
  });
  if (response.ok) {
    alert('Data updated!');
    fetchData();
  }
}

// Get SHA of Existing File
async function getFileSha() {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`);
  const file = await response.json();
  return file.sha;
}
